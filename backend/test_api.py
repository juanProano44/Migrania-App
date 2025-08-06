#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'migraine_app.settings')
django.setup()

from django.test import Client
from usuarios.models import Usuario
import json

print("=== PRUEBA DE API ===")

client = Client()

# Probar endpoint de tratamientos
print("1. Probando endpoint de tratamientos...")
response = client.get('/api/tratamiento/tratamientos/?paciente=1')
print(f"Status: {response.status_code}")

if response.status_code == 200:
    try:
        data = json.loads(response.content)
        if isinstance(data, list):
            print(f"Tratamientos encontrados: {len(data)}")
            for i, t in enumerate(data):
                print(f"  Tratamiento {i+1}: ID={t.get('id')}, Activo={t.get('activo')}")
        else:
            results = data.get('results', [])
            print(f"Tratamientos encontrados: {len(results)}")
            for i, t in enumerate(results):
                print(f"  Tratamiento {i+1}: ID={t.get('id')}, Activo={t.get('activo')}")
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        print(f"Content: {response.content[:200]}")
else:
    print(f"Error {response.status_code}: {response.content[:200]}")

# Probar endpoint de usuario paciente
print("\n2. Probando endpoint de usuario...")
response = client.get('/api/usuarios/3/')
print(f"Status: {response.status_code}")

if response.status_code == 200:
    try:
        data = json.loads(response.content)
        print(f"Paciente: {data.get('first_name')} {data.get('last_name')} - {data.get('email')}")
    except Exception as e:
        print(f"Error parsing JSON: {e}")
else:
    print(f"Error {response.status_code}: {response.content[:200]}")
