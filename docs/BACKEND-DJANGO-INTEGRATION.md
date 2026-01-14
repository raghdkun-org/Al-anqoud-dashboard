# Django Backend Integration Guide

Complete guide for integrating the B-Dashboard frontend with a Django REST Framework backend, including AI/agent capabilities.

---

## Table of Contents

- [Overview](#overview)
- [Project Setup](#project-setup)
- [Database Models](#database-models)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Theme System](#theme-system)
- [Dashboard Personalization](#dashboard-personalization)
- [User Preferences](#user-preferences)
- [Widget Data](#widget-data)
- [AI/Agent Integration](#aiagent-integration)
- [Testing & Deployment](#testing--deployment)

---

## Overview

### Django Stack Recommendations

```
Backend Framework: Django 4.2+
REST API: Django REST Framework (DRF) 3.14+
Authentication: djangorestframework-simplejwt or djoser
Database: PostgreSQL (recommended) or SQLite (dev)
WebSockets: Django Channels (optional, for real-time)
Async Support: Celery + Redis (for background tasks)
AI Integration: LangChain, OpenAI API, or custom agents
```

### Architecture

```
┌──────────────────────────────────────────┐
│   B-Dashboard (Next.js Frontend)         │
└──────────────────────────────────────────┘
                    │
                    │ HTTP/WebSocket
                    ↓
┌──────────────────────────────────────────┐
│   Django REST API                        │
├──────────────────────────────────────────┤
│  • Token Authentication (JWT)            │
│  • User Management                       │
│  • Theme/Preference Storage              │
│  • Widget Data & Caching                 │
│  • AI Agent Endpoints                    │
└──────────────────────────────────────────┘
                    │
                    ↓
┌──────────────────────────────────────────┐
│   PostgreSQL Database                    │
└──────────────────────────────────────────┘
                    ↑
                    │
┌──────────────────────────────────────────┐
│   Redis Cache & Celery (optional)        │
└──────────────────────────────────────────┘
```

---

## Project Setup

### 1. Create Django Project

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install django==4.2
pip install djangorestframework==3.14.0
pip install djangorestframework-simplejwt==5.3.2
pip install django-cors-headers==4.3.1
pip install python-decouple==3.8
pip install psycopg2-binary==2.9.9  # PostgreSQL adapter
pip install celery==5.3.4
pip install redis==5.0.1
pip install langchain==0.1.11
pip install openai==1.3.9

# Create Django project
django-admin startproject dashboard_api .
django-admin startapp auth_app
django-admin startapp themes
django-admin startapp dashboard
django-admin startapp ai_agents
django-admin startapp widgets
```

### 2. Settings Configuration

Create `.env` file:

```env
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=b_dashboard
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
JWT_REFRESH_EXPIRATION_DAYS=30

# Redis
REDIS_URL=redis://localhost:6379/0

# AI Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4
LANGCHAIN_API_KEY=your-langchain-key

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password
```

Update `settings.py`:

```python
from pathlib import Path
import os
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = config('DEBUG', default=False, cast=bool)
SECRET_KEY = config('SECRET_KEY')
ALLOWED_HOSTS = ['*']

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    config('FRONTEND_URL', default='http://localhost:3000'),
    'http://localhost:3000',
    'http://localhost:3001',
]

CORS_ALLOW_CREDENTIALS = True

# Installed Apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_celery_beat',
    'django_celery_results',
    
    'auth_app',
    'themes',
    'dashboard',
    'ai_agents',
    'widgets',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# JWT Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=config('JWT_EXPIRATION_HOURS', default=24, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=config('JWT_REFRESH_EXPIRATION_DAYS', default=30, cast=int)),
    'ALGORITHM': config('JWT_ALGORITHM', default='HS256'),
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Database
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.sqlite3'),
        'NAME': config('DB_NAME', default=BASE_DIR / 'db.sqlite3'),
        'USER': config('DB_USER', default=''),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default=''),
        'PORT': config('DB_PORT', default=''),
    }
}

# Celery Configuration
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

---

## Database Models

### User Model

```python
# auth_app/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('user', 'User'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    avatar = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True)
    
    # Preferences
    preferred_locale = models.CharField(max_length=5, default='en')
    theme_mode = models.CharField(
        max_length=10,
        choices=[('light', 'Light'), ('dark', 'Dark'), ('system', 'System')],
        default='system'
    )
    sidebar_collapsed = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.email} ({self.role})"
```

### Theme Model

```python
# themes/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Theme(models.Model):
    COLOR_MODE_CHOICES = (
        ('light', 'Light'),
        ('dark', 'Dark'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='themes')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color_mode = models.CharField(max_length=10, choices=COLOR_MODE_CHOICES)
    
    # Colors stored as JSON
    colors = models.JSONField(default=dict)
    border_radius = models.CharField(max_length=50, default='0.5rem')
    
    is_active = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    is_system = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'themes'
        ordering = ['-is_active', '-created_at']
        unique_together = ('user', 'name')
    
    def __str__(self):
        return f"{self.name} ({self.user.email})"
    
    def save(self, *args, **kwargs):
        # Only one active theme per user
        if self.is_active:
            Theme.objects.filter(user=self.user).exclude(id=self.id).update(is_active=False)
        super().save(*args, **kwargs)
```

### Dashboard Layout Model

```python
# dashboard/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class DashboardView(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dashboard_views')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    
    widgets_config = models.JSONField(default=list)  # Widget layout data
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'dashboard_views'
        ordering = ['-is_active', '-created_at']
        unique_together = ('user', 'name')
    
    def __str__(self):
        return f"{self.name} - {self.user.email}"
    
    def save(self, *args, **kwargs):
        if self.is_active:
            DashboardView.objects.filter(user=self.user).exclude(id=self.id).update(is_active=False)
        super().save(*args, **kwargs)

class UserPreferences(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    
    locale = models.CharField(max_length=5, default='en')
    theme_mode = models.CharField(
        max_length=10,
        choices=[('light', 'Light'), ('dark', 'Dark'), ('system', 'System')],
        default='system'
    )
    active_theme_id = models.CharField(max_length=100, blank=True, null=True)
    sidebar_collapsed = models.BooleanField(default=False)
    active_dashboard_view = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_preferences'
    
    def __str__(self):
        return f"Preferences - {self.user.email}"
```

### AI Agent Model (for agent state management)

```python
# ai_agents/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class AIAgent(models.Model):
    AGENT_TYPE_CHOICES = (
        ('assistant', 'Assistant'),
        ('analyst', 'Analyst'),
        ('optimizer', 'Optimizer'),
        ('custom', 'Custom'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('training', 'Training'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_agents')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    agent_type = models.CharField(max_length=20, choices=AGENT_TYPE_CHOICES)
    
    # Configuration
    system_prompt = models.TextField()
    model = models.CharField(max_length=50, default='gpt-4')
    temperature = models.FloatField(default=0.7)
    max_tokens = models.IntegerField(default=2000)
    
    # Tools/capabilities
    available_tools = models.JSONField(default=list)  # List of tool names
    
    # State
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    total_interactions = models.IntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_agents'
        ordering = ['-last_used']
    
    def __str__(self):
        return f"{self.name} ({self.agent_type})"

class AgentConversation(models.Model):
    agent = models.ForeignKey(AIAgent, on_delete=models.CASCADE, related_name='conversations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agent_conversations')
    
    title = models.CharField(max_length=200, blank=True)
    messages = models.JSONField(default=list)  # Chat history
    
    total_tokens_used = models.IntegerField(default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'agent_conversations'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.agent.name} - {self.user.email}"
```

---

## Authentication

### JWT Authentication Setup

```python
# auth_app/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'status', 'avatar', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['status'] = user.status
        
        return token

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'User not found'})
        
        if not user.check_password(password):
            raise serializers.ValidationError({'password': 'Invalid password'})
        
        data['user'] = user
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm']
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
            status='pending'
        )
        return user
```

### Auth Views

```python
# auth_app/views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import (
    CustomTokenObtainPairSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Token is invalidated on frontend by clearing localStorage
        # Optionally blacklist token on backend
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
```

### URL Configuration

```python
# auth_app/urls.py
from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    LoginView,
    RegisterView,
    MeView,
    LogoutView,
)

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', MeView.as_view(), name='me'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
```

---

## API Endpoints

### Authentication Endpoints

```
POST   /api/auth/token/          - Get JWT tokens
POST   /api/auth/login/          - Login with email/password
POST   /api/auth/register/       - Register new user
GET    /api/auth/me/             - Get current user
POST   /api/auth/logout/         - Logout (frontend clears token)
POST   /api/auth/refresh/        - Refresh access token
```

### Theme Endpoints

```python
# themes/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Theme
from .serializers import ThemeSerializer

class ThemeViewSet(viewsets.ModelViewSet):
    serializer_class = ThemeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Theme.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get currently active theme"""
        try:
            theme = Theme.objects.get(user=request.user, is_active=True)
            serializer = self.get_serializer(theme)
            return Response(serializer.data)
        except Theme.DoesNotExist:
            return Response(
                {'detail': 'No active theme'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def set_active(self, request, pk=None):
        """Set theme as active"""
        theme = self.get_object()
        Theme.objects.filter(user=request.user).update(is_active=False)
        theme.is_active = True
        theme.save()
        return Response(
            self.get_serializer(theme).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'])
    def import_theme(self, request):
        """Import theme from JSON"""
        try:
            theme_data = request.data
            serializer = self.get_serializer(data=theme_data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export theme as JSON"""
        theme = self.get_object()
        serializer = self.get_serializer(theme)
        return Response(serializer.data)
```

### Dashboard Endpoints

```python
# dashboard/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DashboardView, UserPreferences
from .serializers import DashboardViewSerializer, UserPreferencesSerializer

class DashboardViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardViewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return DashboardView.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_active(self, request, pk=None):
        """Set dashboard view as active"""
        view = self.get_object()
        DashboardView.objects.filter(user=request.user).update(is_active=False)
        view.is_active = True
        view.save()
        return Response(self.get_serializer(view).data, status=status.HTTP_200_OK)

class UserPreferencesViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def list(self, request):
        """Get user preferences"""
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(prefs)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update(self, request):
        """Update user preferences"""
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(prefs, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

---

## Theme System

### Theme Serializer

```python
# themes/serializers.py
from rest_framework import serializers
from .models import Theme

class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = [
            'id', 'name', 'description', 'color_mode', 'colors',
            'border_radius', 'is_active', 'is_default', 'is_system',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_colors(self, value):
        """Validate color object has required fields"""
        required_colors = [
            'background', 'foreground', 'primary', 'secondary',
            'muted', 'accent', 'destructive'
        ]
        
        for color in required_colors:
            if color not in value:
                raise serializers.ValidationError(f"Missing required color: {color}")
        
        return value
```

### Theme Service (Backend)

```python
# themes/services.py
from django.core.cache import cache
from .models import Theme
import json

class ThemeService:
    CACHE_KEY_TEMPLATE = 'theme_{}_active'
    CACHE_TIMEOUT = 3600  # 1 hour
    
    @staticmethod
    def get_active_theme(user):
        """Get active theme with caching"""
        cache_key = ThemeService.CACHE_KEY_TEMPLATE.format(user.id)
        
        theme = cache.get(cache_key)
        if theme is None:
            try:
                theme = Theme.objects.get(user=user, is_active=True)
                cache.set(cache_key, theme, ThemeService.CACHE_TIMEOUT)
            except Theme.DoesNotExist:
                return None
        
        return theme
    
    @staticmethod
    def set_active_theme(user, theme_id):
        """Set active theme and clear cache"""
        Theme.objects.filter(user=user).update(is_active=False)
        theme = Theme.objects.get(id=theme_id, user=user)
        theme.is_active = True
        theme.save()
        
        # Invalidate cache
        cache_key = ThemeService.CACHE_KEY_TEMPLATE.format(user.id)
        cache.delete(cache_key)
        
        return theme
    
    @staticmethod
    def export_theme(theme):
        """Export theme as JSON"""
        return {
            'name': theme.name,
            'description': theme.description,
            'color_mode': theme.color_mode,
            'colors': theme.colors,
            'border_radius': theme.border_radius,
        }
    
    @staticmethod
    def import_theme(user, theme_data):
        """Import theme from JSON"""
        theme = Theme.objects.create(
            user=user,
            name=theme_data['name'],
            description=theme_data.get('description', ''),
            color_mode=theme_data.get('color_mode', 'light'),
            colors=theme_data.get('colors', {}),
            border_radius=theme_data.get('border_radius', '0.5rem'),
        )
        return theme
```

---

## Dashboard Personalization

### Dashboard Serializers

```python
# dashboard/serializers.py
from rest_framework import serializers
from .models import DashboardView, UserPreferences

class DashboardViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardView
        fields = [
            'id', 'name', 'description', 'widgets_config',
            'is_default', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = [
            'locale', 'theme_mode', 'active_theme_id',
            'sidebar_collapsed', 'active_dashboard_view',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
```

### Widget Configuration

```python
# widgets/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Widget(models.Model):
    WIDGET_TYPE_CHOICES = (
        ('stats', 'Stats Card'),
        ('chart', 'Chart'),
        ('table', 'Table'),
        ('calendar', 'Calendar'),
        ('custom', 'Custom'),
    )
    
    name = models.CharField(max_length=100)
    widget_type = models.CharField(max_length=20, choices=WIDGET_TYPE_CHOICES)
    description = models.TextField(blank=True)
    
    # Configuration template
    config_schema = models.JSONField(default=dict)  # JSON schema for widget config
    
    # Permissions
    is_public = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_widgets')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'widgets'
    
    def __str__(self):
        return f"{self.name} ({self.widget_type})"

class WidgetData(models.Model):
    widget = models.ForeignKey(Widget, on_delete=models.CASCADE, related_name='data')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='widget_data')
    
    # Data storage
    data = models.JSONField(default=dict)
    
    # Cache control
    cached_at = models.DateTimeField(auto_now=True)
    cache_ttl = models.IntegerField(default=300)  # 5 minutes default
    
    class Meta:
        db_table = 'widget_data'
        unique_together = ('widget', 'user')
    
    def is_cache_valid(self):
        from django.utils import timezone
        from datetime import timedelta
        return (timezone.now() - self.cached_at).total_seconds() < self.cache_ttl
```

---

## User Preferences

### Preferences Service

```python
# dashboard/services.py
from django.core.cache import cache
from .models import UserPreferences

class PreferencesService:
    CACHE_KEY_TEMPLATE = 'user_preferences_{}'
    CACHE_TIMEOUT = 7200  # 2 hours
    
    @staticmethod
    def get_preferences(user):
        """Get user preferences with caching"""
        cache_key = PreferencesService.CACHE_KEY_TEMPLATE.format(user.id)
        
        prefs = cache.get(cache_key)
        if prefs is None:
            prefs, _ = UserPreferences.objects.get_or_create(user=user)
            cache.set(cache_key, prefs, PreferencesService.CACHE_TIMEOUT)
        
        return prefs
    
    @staticmethod
    def update_preferences(user, data):
        """Update preferences and invalidate cache"""
        prefs, _ = UserPreferences.objects.get_or_create(user=user)
        
        for key, value in data.items():
            if hasattr(prefs, key):
                setattr(prefs, key, value)
        
        prefs.save()
        
        # Invalidate cache
        cache_key = PreferencesService.CACHE_KEY_TEMPLATE.format(user.id)
        cache.delete(cache_key)
        
        return prefs
```

---

## Widget Data

### Widget API

```python
# widgets/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from .models import Widget, WidgetData
from .serializers import WidgetSerializer, WidgetDataSerializer

class WidgetViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WidgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Get public widgets + user's custom widgets
        return Widget.objects.filter(is_public=True) | Widget.objects.filter(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def data(self, request, pk=None):
        """Get widget data for current user"""
        widget = self.get_object()
        
        # Try to get cached data
        cache_key = f'widget_data_{widget.id}_{request.user.id}'
        data = cache.get(cache_key)
        
        if data is None:
            try:
                widget_data = WidgetData.objects.get(widget=widget, user=request.user)
                data = widget_data.data
                
                # Cache the data
                cache.set(cache_key, data, widget_data.cache_ttl)
            except WidgetData.DoesNotExist:
                return Response(
                    {'data': {}, 'message': 'No data available'},
                    status=status.HTTP_200_OK
                )
        
        return Response({'data': data}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def refresh(self, request, pk=None):
        """Force refresh widget data"""
        widget = self.get_object()
        
        # Invalidate cache
        cache_key = f'widget_data_{widget.id}_{request.user.id}'
        cache.delete(cache_key)
        
        # Trigger data refresh (could call external API, etc.)
        # This is a placeholder - implement actual data fetching
        
        return Response(
            {'message': 'Widget data refresh triggered'},
            status=status.HTTP_200_OK
        )
```

---

## AI/Agent Integration

### AI Agent Service

```python
# ai_agents/services.py
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from django.core.cache import cache
from .models import AIAgent, AgentConversation
import os

class AIAgentService:
    def __init__(self, agent: AIAgent):
        self.agent = agent
        self.llm = ChatOpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            model_name=agent.model,
            temperature=agent.temperature,
            max_tokens=agent.max_tokens,
        )
    
    def initialize_conversation(self, user, title=None):
        """Create new conversation"""
        conversation = AgentConversation.objects.create(
            agent=self.agent,
            user=user,
            title=title or f"{self.agent.name} - New Chat",
            messages=[]
        )
        return conversation
    
    def send_message(self, conversation, user_message):
        """Send message and get AI response"""
        try:
            # Build message history
            messages = [SystemMessage(content=self.agent.system_prompt)]
            
            for msg in conversation.messages:
                if msg['role'] == 'user':
                    messages.append(HumanMessage(content=msg['content']))
                elif msg['role'] == 'assistant':
                    messages.append(AIMessage(content=msg['content']))
            
            # Add new user message
            messages.append(HumanMessage(content=user_message))
            
            # Get AI response
            response = self.llm(messages)
            ai_response = response.content
            
            # Update conversation history
            conversation.messages.append({
                'role': 'user',
                'content': user_message,
                'timestamp': datetime.now().isoformat()
            })
            conversation.messages.append({
                'role': 'assistant',
                'content': ai_response,
                'timestamp': datetime.now().isoformat()
            })
            
            # Update statistics
            # This is simplified - use actual token counting
            estimated_tokens = len(user_message.split()) + len(ai_response.split())
            conversation.total_tokens_used += estimated_tokens
            conversation.save()
            
            # Update agent statistics
            self.agent.total_interactions += 1
            self.agent.last_used = timezone.now()
            self.agent.save()
            
            return {
                'response': ai_response,
                'tokens_used': estimated_tokens,
                'conversation_id': conversation.id
            }
        
        except Exception as e:
            return {
                'error': str(e),
                'response': None
            }
    
    def get_available_tools(self):
        """Get list of available tools for this agent"""
        tools_map = {
            'search': 'Search functionality',
            'analysis': 'Data analysis',
            'reporting': 'Report generation',
            'automation': 'Task automation',
        }
        
        return [
            {'name': tool, 'description': tools_map.get(tool, 'Unknown')}
            for tool in self.agent.available_tools
        ]
```

### AI Agent Views

```python
# ai_agents/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import AIAgent, AgentConversation
from .serializers import AIAgentSerializer, AgentConversationSerializer
from .services import AIAgentService

class AIAgentViewSet(viewsets.ModelViewSet):
    serializer_class = AIAgentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AIAgent.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def chat(self, request, pk=None):
        """Send message to AI agent"""
        agent = self.get_object()
        message = request.data.get('message')
        conversation_id = request.data.get('conversation_id')
        
        if not message:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get or create conversation
            if conversation_id:
                conversation = AgentConversation.objects.get(
                    id=conversation_id,
                    agent=agent,
                    user=request.user
                )
            else:
                conversation = AgentConversation.objects.create(
                    agent=agent,
                    user=request.user,
                    title=f"{agent.name} - {timezone.now().strftime('%Y-%m-%d %H:%M')}"
                )
            
            # Get AI response
            service = AIAgentService(agent)
            result = service.send_message(conversation, message)
            
            if 'error' in result:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
            return Response(result, status=status.HTTP_200_OK)
        
        except AgentConversation.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get all conversations for user"""
        conversations = AgentConversation.objects.filter(user=request.user)
        serializer = AgentConversationSerializer(conversations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def tools(self, request, pk=None):
        """Get available tools for agent"""
        agent = self.get_object()
        service = AIAgentService(agent)
        return Response(
            {'tools': service.get_available_tools()},
            status=status.HTTP_200_OK
        )
```

### Celery Task for Async Processing

```python
# ai_agents/tasks.py
from celery import shared_task
from django.contrib.auth import get_user_model
from .models import AIAgent, AgentConversation
from .services import AIAgentService

User = get_user_model()

@shared_task
def process_agent_message(agent_id, conversation_id, user_id, message):
    """Process agent message asynchronously"""
    try:
        agent = AIAgent.objects.get(id=agent_id)
        conversation = AgentConversation.objects.get(id=conversation_id)
        
        service = AIAgentService(agent)
        result = service.send_message(conversation, message)
        
        return result
    except Exception as e:
        return {'error': str(e)}

@shared_task
def cleanup_old_conversations():
    """Cleanup old conversations (older than 90 days)"""
    from django.utils import timezone
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=90)
    AgentConversation.objects.filter(created_at__lt=cutoff_date).delete()
```

---

## Testing & Deployment

### Django Testing

```python
# tests/test_auth.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'first_name': 'Test',
            'password': 'testpass123',
            'password_confirm': 'testpass123'
        }
    
    def test_user_registration(self):
        response = self.client.post('/api/auth/register/', self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=self.user_data['email']).exists())
    
    def test_user_login(self):
        # First create user
        User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        # Then login
        response = self.client.post('/api/auth/login/', {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
```

### Docker Setup

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

CMD ["gunicorn", "dashboard_api.wsgi:application", "--bind", "0.0.0.0:8000"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: b_dashboard
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: .
    command: >
      bash -c "python manage.py migrate &&
               python manage.py runserver 0.0.0.0:8000"
    ports:
      - "8000:8000"
    environment:
      DEBUG: 'True'
      DB_HOST: db
      REDIS_URL: redis://redis:6379/0
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - db
      - redis

  celery:
    build: .
    command: celery -A dashboard_api worker -l info
    environment:
      DEBUG: 'False'
      DB_HOST: db
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis

  celery-beat:
    build: .
    command: celery -A dashboard_api beat -l info
    environment:
      DEBUG: 'False'
      DB_HOST: db
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis
```

### Production Deployment

```bash
# Build and push Docker image
docker build -t your-registry/b-dashboard-api:latest .
docker push your-registry/b-dashboard-api:latest

# Deploy with Kubernetes
kubectl apply -f k8s/deployment.yaml

# Run migrations
python manage.py migrate --noinput

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

---

## Best Practices for Django

1. **Use environment variables** for all sensitive config
2. **Implement proper pagination** for list endpoints
3. **Add caching** for frequently accessed data (themes, preferences)
4. **Use Celery** for async tasks (email, AI processing)
5. **Implement rate limiting** on API endpoints
6. **Add comprehensive logging** for debugging
7. **Use database transactions** for critical operations
8. **Implement API versioning** (/api/v1/)
9. **Add OpenAPI/Swagger documentation**
10. **Regular security audits** and dependency updates

---

## Security Considerations

```python
# settings.py additions for production

# HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Headers
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Content Security Policy (via django-csp package)
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "cdn.example.com")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")

# Rate limiting
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

class AnonRateThrottle(AnonRateThrottle):
    rate = '100/hour'

class UserRateThrottle(UserRateThrottle):
    rate = '1000/hour'

REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = [
    'api.throttles.AnonRateThrottle',
    'api.throttles.UserRateThrottle',
]
```

---

## Quick Start

```bash
# 1. Clone and setup
git clone <repo>
cd dashboard_api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Run migrations
python manage.py migrate

# 4. Create admin user
python manage.py createsuperuser

# 5. Start development server
python manage.py runserver

# 6. Visit API
# http://localhost:8000/api/
# http://localhost:8000/admin/
```

For additional documentation, refer to:
- [Django REST Framework Docs](https://www.django-rest-framework.org/)
- [Django Channels Docs](https://channels.readthedocs.io/)
- [LangChain Docs](https://python.langchain.com/)
