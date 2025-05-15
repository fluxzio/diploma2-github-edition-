from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from .models import File, FileShare, UserProfile
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import (
    UserSerializer, UserProfileSerializer, EncryptedFileSerializer,
    FileShareSerializer, UserRegistrationSerializer
)
from cryptography.fernet import Fernet
import os
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import serializers
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import logging
from django.db.models import Count
from datetime import timedelta

logger = logging.getLogger(__name__)

# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['register', 'login', 'reset_password']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'],permission_classes=[permissions.AllowAny])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Please provide both username and password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                }
            })
        else:
            return Response(
                {'error': 'Invalid username or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def reset_password(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            new_password = get_random_string(12)
            user.set_password(new_password)
            user.save()
            
            send_mail(
                'Password Reset',
                f'Your new password is: {new_password}',
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            return Response({'message': 'Password reset email sent'})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

class EncryptedFileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = EncryptedFileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Received file upload request from user {request.user.username}")
            
            if 'file' not in request.FILES:
                logger.error("No file provided in request")
                return Response(
                    {'error': 'No file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            file = request.FILES['file']
            logger.info(f"Processing file: {file.name}, size: {file.size}")

            # Generate encryption key
            key = Fernet.generate_key()
            f = Fernet(key)

            # Read and encrypt file content
            file_content = file.read()
            encrypted_data = f.encrypt(file_content)

            # Create unique filename
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            safe_filename = f"{timestamp}_{file.name}"
            encrypted_file_path = os.path.join('encrypted_files', safe_filename)

            # Save encrypted file using Django's storage
            path = default_storage.save(encrypted_file_path, ContentFile(encrypted_data))
            logger.info(f"Saved encrypted file to: {path}")

            # Create file record
            file_obj = File.objects.create(
                name=file.name,
                file=path,
                owner=request.user,
                is_encrypted=True,
                encryption_key=key.decode()
            )
            logger.info(f"Created file record with ID: {file_obj.id}")

            serializer = self.get_serializer(file_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}", exc_info=True)
            return Response(
                {'error': f'File upload failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        try:
            file_obj = self.get_object()
            
            # Check if user has permission to download
            if file_obj.owner != request.user:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Decrypt file
            f = Fernet(file_obj.encryption_key.encode())
            encrypted_data = default_storage.open(file_obj.file.path).read()
            decrypted_data = f.decrypt(encrypted_data)

            # Create response
            response = HttpResponse(decrypted_data, content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{file_obj.name}"'
            return response
        except Exception as e:
            logger.error(f"Error downloading file: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Download failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        file = self.get_object()
        shared_with_username = request.data.get('username')
        
        try:
            shared_with = User.objects.get(username=shared_with_username)
            share = FileShare.objects.create(
                file=file,
                shared_with=shared_with,
                access_token=get_random_string(32)
            )
            return Response(FileShareSerializer(share).data)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class FileShareViewSet(viewsets.ModelViewSet):
    queryset = FileShare.objects.all()
    serializer_class = FileShareSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FileShare.objects.filter(shared_with=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Get dashboard statistics for the authenticated user
    """
    user = request.user
    
    try:
        # Get total files count
        total_files = File.objects.filter(owner=user).count()
        
        # Get total shared files count
        total_shared = FileShare.objects.filter(file__owner=user).count()
        
        # Get total downloads count
        total_downloads = FileShare.objects.filter(
            file__owner=user,
            downloaded=True
        ).count()
        
        # Get recent activities (last 10)
        recent_activities = []
        
        # Get recent uploads
        recent_uploads = File.objects.filter(
            owner=user,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')[:5]
        
        for file in recent_uploads:
            recent_activities.append({
                'type': 'upload',
                'description': f'Загружен файл: {file.name}',
                'timestamp': file.created_at.isoformat()
            })
        
        # Get recent shares
        recent_shares = FileShare.objects.filter(
            file__owner=user,
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')[:5]
        
        for share in recent_shares:
            recent_activities.append({
                'type': 'share',
                'description': f'Файл {share.file.name} предоставлен пользователю {share.shared_with.username}',
                'timestamp': share.created_at.isoformat()
            })
        
        # Get recent downloads
        recent_downloads = FileShare.objects.filter(
            file__owner=user,
            downloaded=True,
            downloaded_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-downloaded_at')[:5]
        
        for download in recent_downloads:
            recent_activities.append({
                'type': 'download',
                'description': f'Файл {download.file.name} скачан пользователем {download.shared_with.username}',
                'timestamp': download.downloaded_at.isoformat()
            })
        
        # Sort activities by timestamp
        recent_activities.sort(key=lambda x: x['timestamp'], reverse=True)
        recent_activities = recent_activities[:10]  # Get only the 10 most recent activities
        
        return Response({
            'total_files': total_files,
            'total_shared': total_shared,
            'total_downloads': total_downloads,
            'recent_activities': recent_activities
        })
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}", exc_info=True)
        return Response({
            'total_files': 0,
            'total_shared': 0,
            'total_downloads': 0,
            'recent_activities': []
        })

@api_view(['POST'])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': serializer.data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not user.check_password(old_password):
        return Response(
            {'error': 'Invalid old password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    return Response({'message': 'Password changed successfully'})

@api_view(['POST'])
def reset_password(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        new_password = get_random_string(12)
        user.set_password(new_password)
        user.save()
        
        send_mail(
            'Password Reset',
            f'Your new password is: {new_password}',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        return Response({'message': 'Password reset email sent'})
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
def verify_reset_token(request):
    token = request.data.get('token')
    try:
        # Здесь должна быть логика проверки токена
        return Response({'message': 'Token is valid'})
    except Exception as e:
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
def set_new_password(request):
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    try:
        # Здесь должна быть логика установки нового пароля
        return Response({'message': 'Password updated successfully'})
    except Exception as e:
        return Response(
            {'error': 'Failed to update password'},
            status=status.HTTP_400_BAD_REQUEST
        )
