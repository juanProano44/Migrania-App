#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'migraine_app.settings')
django.setup()

import requests
from usuarios.models import Usuario

print("=== PRUEBA DE API CON AUTENTICACIÓN ===")

# Obtener token de autenticación
login_data = {
    'email': 'medico@test.com',
    'password': 'testpass123'
}

try:
    # Obtener token
    response = requests.post('http://localhost:8000/api/auth/jwt/create/', json=login_data)
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data['access']
        print(f"Token obtenido exitosamente")
        
        # Headers con autenticación
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Probar endpoint de tratamientos con paciente ID 3
        print("\n1. Probando tratamientos para paciente ID 3...")
        response = requests.get('http://localhost:8000/api/tratamientos/?paciente=3', headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"Tratamientos encontrados: {len(data)}")
                for i, t in enumerate(data):
                    print(f"  Tratamiento {i+1}: ID={t.get('id')}, Activo={t.get('activo')}, Cumplimiento={t.get('cumplimiento')}%")
            else:
                results = data.get('results', [])
                print(f"Tratamientos encontrados: {len(results)}")
                for i, t in enumerate(results):
                    print(f"  Tratamiento {i+1}: ID={t.get('id')}, Activo={t.get('activo')}, Cumplimiento={t.get('cumplimiento')}%")
        else:
            print(f"Error {response.status_code}: {response.text[:200]}")
            
        # Probar endpoint de usuario paciente
        print("\n2. Probando información del paciente ID 3...")
        response = requests.get('http://localhost:8000/api/usuarios/3/', headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Paciente: {data.get('first_name')} {data.get('last_name')} - {data.get('email')}")
        else:
            print(f"Error {response.status_code}: {response.text[:200]}")
            
    else:
        print(f"Error obteniendo token: {response.status_code} - {response.text}")
        
except Exception as e:
    print(f"Error de conexión: {e}")
