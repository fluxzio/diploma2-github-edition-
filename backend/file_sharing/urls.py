from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .serializers import (
    UserSerializer, UserProfileSerializer, FileSerializer,
    FileShareSerializer, UserRegistrationSerializer
)

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'files', views.EncryptedFileViewSet, basename='file')
router.register(r'shares', views.FileShareViewSet, basename='share')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', views.dashboard_stats),
] 