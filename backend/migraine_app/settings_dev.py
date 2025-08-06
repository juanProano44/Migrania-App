# settings_dev.py - Configuración para desarrollo local
from .settings import *
import os

# Sobrescribir la configuración de base de datos para desarrollo
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db_dev.sqlite3',
    }
}

# Configuraciones adicionales para desarrollo
DEBUG = True
ALLOWED_HOSTS = ['*']

# Deshabilitar HTTPS para desarrollo local
SECURE_SSL_REDIRECT = False
SECURE_PROXY_SSL_HEADER = None

print("🔧 Usando configuración de desarrollo con SQLite")
