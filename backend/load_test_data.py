#!/usr/bin/env python
import os
import sys
import django
from datetime import date, datetime

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'migraine_app.settings')
django.setup()

from usuarios.models import Usuario, MedicoProfile, PacienteProfile
from evaluacion_diagnostico.models import EpisodioCefalea
from tratamiento.models import Tratamiento, Medicamento

def create_test_data():
    print("Creando datos de prueba...")
    
    # Obtener o crear usuarios
    medico_user, created = Usuario.objects.get_or_create(
        email='medico@test.com',
        defaults={
            'username': 'medico_test',
            'cedula': '3333333333',
            'first_name': 'Dr. Carlos',
            'last_name': 'Rodríguez',
            'tipo_usuario': 'medico'
        }
    )
    if created:
        medico_user.set_password('testpass123')
        medico_user.save()
    
    paciente_user, created = Usuario.objects.get_or_create(
        email='paciente@test.com',
        defaults={
            'username': 'paciente_test',
            'cedula': '4444444444',
            'first_name': 'Juan',
            'last_name': 'Pérez',
            'tipo_usuario': 'paciente'
        }
    )
    if created:
        paciente_user.set_password('testpass123')
        paciente_user.save()
    
    # Crear perfiles
    medico_profile, created = MedicoProfile.objects.get_or_create(
        usuario=medico_user,
        defaults={
            'numero_licencia': 'MED-12345',
            'especializacion': 'neurologia',
            'anos_experiencia': 15
        }
    )
    
    paciente_profile, created = PacienteProfile.objects.get_or_create(
        usuario=paciente_user,
        defaults={
            'numero_seguro': 'SEG-789456',
            'contacto_emergencia_nombre': 'María Pérez',
            'contacto_emergencia_telefono': '3009876543',
            'contacto_emergencia_relacion': 'Esposa',
            'alergias': 'Ninguna conocida',
            'grupo_sanguineo': 'O+',
            'medicamentos_actuales': 'Ibuprofeno según necesidad',
            'enfermedades_cronicas': 'Migraña crónica'
        }
    )
    
    # Crear episodios de cefalea
    episodio1 = EpisodioCefalea.objects.create(
        paciente=paciente_user,
        duracion_cefalea_horas=6,
        severidad='Moderada',
        localizacion='Unilateral',
        caracter_dolor='Pulsátil',
        empeora_actividad=True,
        nauseas_vomitos=True,
        fotofobia=True,
        fonofobia=True,
        presencia_aura=False,
        duracion_aura_minutos=0,
        en_menstruacion=False,
        anticonceptivos=False,
        categoria_diagnostica='Migraña sin aura',
        creado_en=datetime.now()
    )
    
    episodio2 = EpisodioCefalea.objects.create(
        paciente=paciente_user,
        duracion_cefalea_horas=4,
        severidad='Leve',
        localizacion='Bilateral',
        caracter_dolor='Opresivo',
        empeora_actividad=False,
        nauseas_vomitos=False,
        fotofobia=False,
        fonofobia=False,
        presencia_aura=False,
        duracion_aura_minutos=0,
        en_menstruacion=False,
        anticonceptivos=False,
        categoria_diagnostica='Cefalea de tipo tensional',
        creado_en=datetime.now()
    )
    
    # Crear tratamientos
    tratamiento1 = Tratamiento.objects.create(
        episodio=episodio1,
        paciente=paciente_profile,  # Aquí sí va paciente_profile
        recomendaciones=['Rutina regular de sueño', 'Hidratación adecuada', 'Evitar estrés'],
        observaciones='Paciente con episodios recurrentes. Buena respuesta a tratamiento previo.',
        fecha_inicio=date.today(),
        activo=True,
        cumplimiento=75.0
    )
    
    # Crear medicamentos para tratamiento1
    med1 = Medicamento.objects.create(
        nombre='Ibuprofeno',
        dosis='400mg',
        caracteristica='Antiinflamatorio',
        frecuencia_horas=8,
        duracion_dias=5,
        hora_de_inicio='08:00'
    )
    tratamiento1.medicamentos.add(med1)
    
    med2 = Medicamento.objects.create(
        nombre='Paracetamol',
        dosis='500mg',
        caracteristica='Analgésico',
        frecuencia_horas=6,
        duracion_dias=3,
        hora_de_inicio='09:00'
    )
    tratamiento1.medicamentos.add(med2)
    
    tratamiento2 = Tratamiento.objects.create(
        episodio=episodio2,
        paciente=paciente_profile,
        recomendaciones=['Ejercicio moderado', 'Técnicas de relajación'],
        observaciones='Episodio leve. Tratamiento preventivo.',
        fecha_inicio=date.today(),
        activo=False,
        cumplimiento=90.0
    )
    
    # Crear medicamento para tratamiento2
    med3 = Medicamento.objects.create(
        nombre='Sumatriptán',
        dosis='50mg',
        caracteristica='Triptán',
        frecuencia_horas=24,
        duracion_dias=1,
        hora_de_inicio='12:00'
    )
    tratamiento2.medicamentos.add(med3)
    
    print("Datos de prueba creados exitosamente!")
    print(f"- Médico: {medico_user.email}")
    print(f"- Paciente: {paciente_user.email}")
    print(f"- Episodios creados: {EpisodioCefalea.objects.count()}")
    print(f"- Tratamientos creados: {Tratamiento.objects.count()}")

if __name__ == '__main__':
    create_test_data()
