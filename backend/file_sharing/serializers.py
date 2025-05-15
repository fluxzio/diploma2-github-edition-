from rest_framework import serializers
from django.contrib.auth.models import User
from .models import File, FileShare, UserProfile
from django.utils import timezone
from cryptography.fernet import Fernet
import os
from django.conf import settings

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)

class FileSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    file_size = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = ('id', 'name', 'file', 'owner', 'created_at', 'updated_at', 'is_encrypted', 'file_size')
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def get_file_size(self, obj):
        if obj.file and hasattr(obj.file, 'size'):
            return obj.file.size
        return None



class FileShareSerializer(serializers.ModelSerializer):
    file = FileSerializer(read_only=True)
    shared_with = UserSerializer(read_only=True)
    
    class Meta:
        model = FileShare
        fields = ('id', 'file', 'shared_with', 'created_at', 'downloaded', 'downloaded_at', 'access_token')
        read_only_fields = ('id', 'created_at', 'downloaded', 'downloaded_at', 'access_token')

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ('id', 'user', 'two_factor_enabled')
        read_only_fields = ('id', 'user')

class EncryptedFileSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
    owner = UserSerializer(read_only=True)
    size = serializers.IntegerField()

    class Meta:
        model = File
        fields = ('id', 'name', 'file', 'owner', 'created_at', 'updated_at', 'is_encrypted','size')



    def create(self, validated_data):
        file = validated_data.pop('file', None)
        if not file:
            raise serializers.ValidationError("No file provided")

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
        full_path = os.path.join(settings.MEDIA_ROOT, encrypted_file_path)

        # Save encrypted file
        with open(full_path, 'wb') as f:
            f.write(encrypted_data)

        # Create file record
        return File.objects.create(
            name=file.name,
            file=encrypted_file_path,
            is_encrypted=True,
            owner=self.context['request'].user,
            **validated_data
        )

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        return user 