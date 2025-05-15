from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from cryptography.fernet import Fernet
import os

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
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    storage_used = models.BigIntegerField(default=0)
    storage_limit = models.BigIntegerField(default=1073741824)  # 1GB in bytes

    def __str__(self):
        return f"{self.user.username}'s profile"
