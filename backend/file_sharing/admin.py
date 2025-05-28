from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *
from django.utils.translation import gettext_lazy as _


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    search_fields = ('name', 'owner__username')
    list_display = ('id', 'name', 'owner', 'created_at',
                    'size', 'is_encrypted')
    autocomplete_fields = ('owner',) 

@admin.register(FileShare)
class FileShareAdmin(admin.ModelAdmin):
    list_display = ('id', 'file', 'shared_with', 'access_token', 'created_at', 'downloaded', 'downloaded_at')
    search_fields = ('file__name', 'shared_with__username', 'access_token')
    list_filter = ('downloaded', 'created_at')
    autocomplete_fields = ('file', 'shared_with')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'role', 'two_factor_enabled', 'last_login_ip', 'storage_used', 'storage_limit')
    search_fields = ('user__username', 'user__email')
    list_filter = ('role', 'two_factor_enabled')
    autocomplete_fields = ('user',)

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'token', 'created_at', 'is_expired')
    search_fields = ('user__username', 'user__email', 'token')
    list_filter = ('created_at',)
    autocomplete_fields = ('user',)

    def is_expired(self, obj):
        return obj.is_expired()
    is_expired.boolean = True
    is_expired.short_description = _('Expired')

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('id', 'username', 'email', 'is_active',
                    'is_staff', 'date_joined')
    search_fields = ('username', 'email')
    list_filter = ('is_active', 'is_staff', 'groups')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {
         'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff',
         'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )

    ordering = ('username',)
    filter_horizontal = ('groups', 'user_permissions',)


admin.site.site_header = _("Панель администратора")
admin.site.site_title = _("Администрирование")
admin.site.index_title = _("Добро пожаловать в админ-панель")