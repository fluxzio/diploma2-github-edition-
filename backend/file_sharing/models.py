import uuid

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    email = models.EmailField(unique=True, verbose_name='Электронная почта')
    username = models.CharField(
        max_length=150, unique=True, verbose_name='Имя пользователя')
    first_name = models.CharField(
        max_length=30, default='', blank=True, verbose_name='Имя')
    last_name = models.CharField(
        max_length=30, default='', blank=True, verbose_name='Фамилия')

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.email


class File(models.Model):
    name = models.CharField(max_length=255, verbose_name='Название файла')
    file = models.FileField(upload_to='encrypted_files/', verbose_name='Файл')
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, verbose_name='Владелец')
    is_encrypted = models.BooleanField(default=True, verbose_name='Зашифрован')
    encryption_key = models.CharField(
        max_length=255, verbose_name='Ключ шифрования')
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name='Дата обновления')
    size = models.BigIntegerField(
        null=True, blank=True, verbose_name='Размер файла (байт)')

    class Meta:
        verbose_name = 'Файл'
        verbose_name_plural = 'Файлы'

    def save(self, *args, **kwargs):
        if self.file:
            self.size = self.file.size
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class FileShare(models.Model):
    file = models.ForeignKey(
        File, on_delete=models.CASCADE, verbose_name='Файл')
    shared_with = models.ForeignKey(
        User, on_delete=models.CASCADE, verbose_name='Кому предоставлен')
    access_token = models.CharField(
        max_length=255, default='', verbose_name='Токен доступа')
    created_at = models.DateTimeField(
        default=timezone.now, verbose_name='Дата создания')
    downloaded = models.BooleanField(default=False, verbose_name='Загружен')
    downloaded_at = models.DateTimeField(
        null=True, blank=True, verbose_name='Дата загрузки')

    class Meta:
        verbose_name = 'Общий доступ к файлу'
        verbose_name_plural = 'Общие доступы к файлам'

    def __str__(self):
        return f"{self.file.name} → {self.shared_with.username}"

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
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, verbose_name='Пользователь')
    role = models.CharField(
        max_length=10, choices=ROLE_CHOICES, default='user', verbose_name='Роль')
    bio = models.TextField(blank=True, verbose_name='О себе')
    profile_picture = models.ImageField(
        upload_to='profile_pictures/', null=True, blank=True, verbose_name='Фото профиля')
    two_factor_enabled = models.BooleanField(
        default=False, verbose_name='Двухфакторная аутентификация')
    two_factor_secret = models.CharField(
        max_length=32, null=True, blank=True, verbose_name='Секрет двухфакторки')
    last_login_ip = models.GenericIPAddressField(
        null=True, blank=True, verbose_name='Последний IP входа')
    storage_used = models.BigIntegerField(
        default=0, verbose_name='Использовано памяти (байт)')
    storage_limit = models.BigIntegerField(
        default=1073741824, verbose_name='Лимит памяти (байт)')

    class Meta:
        verbose_name = 'Профиль пользователя'
        verbose_name_plural = 'Профили пользователей'

    def __str__(self):
        return f"Профиль {self.user.username}"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, verbose_name='Пользователь')
    token = models.UUIDField(
        default=uuid.uuid4, unique=True, verbose_name='Токен')
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Токен сброса пароля'
        verbose_name_plural = 'Токены сброса пароля'

    def is_expired(self):
        return timezone.now() > self.created_at + timezone.timedelta(hours=1)
