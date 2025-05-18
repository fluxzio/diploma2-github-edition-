from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    UserViewSet,
    EncryptedFileViewSet,
    FileShareViewSet,
    dashboard_stats,
    LoginView,
    RegisterView,
    ResetPasswordView,
    VerifyResetTokenView,
    SetNewPasswordView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'files', EncryptedFileViewSet, basename='file')
router.register(r'shares', FileShareViewSet, basename='share')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', dashboard_stats),

    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('auth/verify-reset-token/',
         VerifyResetTokenView.as_view(), name='verify-reset-token'),
    path('auth/set-new-password/',
         SetNewPasswordView.as_view(), name='set-new-password'),
]
