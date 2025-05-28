from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.request import Request
from rest_framework.views import APIView

from django.contrib.auth import authenticate
from django.utils import timezone
from django.http import HttpResponse
from django.conf import settings
from django.utils.crypto import get_random_string
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile


import os
import logging
from datetime import timedelta
from cryptography.fernet import Fernet


from .tasks import *
from .serializers import *
from .models import *
from .permissions import *

logger = logging.getLogger(__name__)



class UserViewSet(viewsets.ModelViewSet[User]):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAuthenticated(), CanDeleteUser()]
        return [IsAuthenticated()]


    @action(detail=False, methods=['get'])
    def me(self, request: Request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    

    @action(detail=False, methods=['post'],url_path='change-password')
    def change_password(self, request):
        user: User = request.user
        old_password = request.data.get('current_password')
        confirm_password = request.data.get('confirm_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password or not confirm_password:
            return Response(
                {'error': 'Пожалуйста, заполните все поля'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if new_password != confirm_password:
            return Response(
                {'error': 'Пароли не совпадают'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {'error': 'Неверный текущий пароль'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Пароль успешно изменён'})


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)


class EncryptedFileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = EncryptedFileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return File.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            logger.info(
                f"Received file upload request from user {request.user.username}")

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
            encrypted_file_path = os.path.join(
                'encrypted_files', safe_filename)

            # Save encrypted file using Django's storage
            path = default_storage.save(
                encrypted_file_path, ContentFile(encrypted_data))
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
            response = HttpResponse(
                decrypted_data, content_type='application/octet-stream')
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
    permission_classes = [IsAuthenticated]

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
        # Get only the 10 most recent activities
        recent_activities = recent_activities[:10]

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


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Введите логин и пароль'}, status=400)

        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': {
                    'id': user.pk,
                    'username': user.username,
                    'email': user.email,
                }
            })
        return Response({'error': 'Неверные данные'}, status=401)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user: User = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': serializer.data
            }, status=201)
        return Response(serializer.errors, status=400)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            reset_token = PasswordResetToken.objects.create(user=user)
            reset_link = f"{settings.FRONTEND_URL}/verify-reset-token?token={reset_token.token}"

            send_email_task.delay(
                subject='Сброс пароля',
                message=f"Перейдите по ссылке для сброса пароля: {reset_link}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
            )
            return Response({'message': 'Ссылка для сброса пароля отправлена'})
        except User.DoesNotExist:
            return Response({'error': 'Пользователь с таким email не найден'}, status=404)


class VerifyResetTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if reset_token.is_expired():
                return Response({'error': 'Token expired'}, status=400)
            return Response({'message': 'Token is valid'})
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=400)


class SetNewPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if reset_token.is_expired():
                return Response({'error': 'Token expired'}, status=400)
            user = reset_token.user
            user.set_password(new_password)
            user.save()
            reset_token.delete()
            return Response({'message': 'Пароль успешно обновлён'})
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=400)
