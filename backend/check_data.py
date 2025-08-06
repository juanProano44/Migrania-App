#!/usr/bin/env python
import os
import django
from datetime import date

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'migraine_app.settings')
django.setup()

from usuarios.models import Usuario, PacienteProfile
from tratamiento.models import Tratamiento

print("=== VERIFICACIÓN DE DATOS ===")
print(f"Total usuarios: {Usuario.objects.count()}")
print(f"Total tratamientos: {Tratamiento.objects.count()}")

# Obtener paciente
paciente = Usuario.objects.filter(tipo_usuario='paciente').first()
if paciente:
    print(f"Paciente encontrado: {paciente.email} (ID: {paciente.id})")
    
    # Obtener perfil del paciente
    try:
        perfil_paciente = paciente.perfil_paciente
        print(f"Perfil paciente ID: {perfil_paciente.id}")
        
        # Obtener tratamientos del paciente
        tratamientos = Tratamiento.objects.filter(paciente=perfil_paciente)
        print(f"Tratamientos del paciente: {tratamientos.count()}")
        
        for t in tratamientos:
            print(f"  - Tratamiento {t.id}: Activo={t.activo}, Cumplimiento={t.cumplimiento}%")
            print(f"    Observaciones: {t.observaciones[:50]}...")
            print(f"    Medicamentos: {t.medicamentos.count()}")
            
    except Exception as e:
        print(f"Error obteniendo perfil: {e}")
else:
    print("No se encontró paciente")
