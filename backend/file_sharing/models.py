import uuid

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=30,default='', blank=True)
    last_name = models.CharField(max_length=30,default='', blank=True)

    def __str__(self):
        return self.email

class File(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='encrypted_files/')
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    is_encrypted = models.BooleanField(default=True)
    encryption_key = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    size = models.BigIntegerField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.file:
            self.size = self.file.size
        super().save(*args, **kwargs)
        
    def __str__(self):
        return self.name

class FileShare(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE)
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE)
    access_token = models.CharField(max_length=255, default='')
    created_at = models.DateTimeField(default=timezone.now)
    downloaded = models.BooleanField(default=False)
    downloaded_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.file.name} shared with {self.shared_with.username}"

    def mark_as_downloaded(self):
        self.downloaded = True
        self.downloaded_at = timezone.now()
        self.save()


class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Администратор'),
        ('manager', 'Менеджер'),
        ('user', 'Пользователь'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(
        max_length=10, choices=ROLE_CHOICES, default='user')
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/', null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    storage_used = models.BigIntegerField(default=0)
    storage_limit = models.BigIntegerField(default=1073741824)  # 1GB

    def __str__(self):
        return f"{self.user.username}'s profile"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timezone.timedelta(hours=1)
