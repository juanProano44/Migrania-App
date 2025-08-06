from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from usuarios.models import PacienteProfile, MedicoProfile
from evaluacion_diagnostico.models import EpisodioCefalea
from tratamiento.models import Tratamiento, Medicamento
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Crear datos de prueba para el feature de generación y seguimiento de tratamiento'

    def handle(self, *args, **options):
        self.stdout.write('🚀 Creando datos de prueba para tratamientos...')

        # 1. Crear usuarios médicos
        self.create_medicos()
        
        # 2. Crear usuarios pacientes
        self.create_pacientes()
        
        # 3. Crear episodios de cefalea
        self.create_episodios()
        
        # 4. Crear tratamientos de ejemplo
        self.create_tratamientos()
        
        self.stdout.write(
            self.style.SUCCESS('✅ Datos de prueba creados exitosamente!')
        )

    def create_medicos(self):
        """Crear médicos de prueba"""
        medicos_data = [
            {
                'username': 'dr_gonzalez',
                'email': 'gonzalez@hospital.com',
                'first_name': 'María',
                'last_name': 'González',
                'cedula': '1234567890',
                'numero_licencia': 'MED-001',
                'especializacion': 'neurologia',
                'anos_experiencia': 10
            },
            {
                'username': 'dr_martinez',
                'email': 'martinez@hospital.com',
                'first_name': 'Carlos',
                'last_name': 'Martínez',
                'cedula': '0987654321',
                'numero_licencia': 'MED-002',
                'especializacion': 'medicina_interna',
                'anos_experiencia': 15
            }
        ]

        for data in medicos_data:
            medico_data = data.copy()
            numero_licencia = medico_data.pop('numero_licencia')
            especializacion = medico_data.pop('especializacion')
            anos_experiencia = medico_data.pop('anos_experiencia')
            
            usuario, created = User.objects.get_or_create(
                username=medico_data['username'],
                defaults={
                    **medico_data,
                    'password': 'testpass123',
                    'tipo_usuario': User.TipoUsuario.MEDICO
                }
            )
            
            if created:
                usuario.set_password('testpass123')
                usuario.save()
                self.stdout.write(f'✅ Usuario médico creado: {usuario.username}')
            
            medico_profile, created = MedicoProfile.objects.get_or_create(
                usuario=usuario,
                defaults={
                    'numero_licencia': numero_licencia,
                    'especializacion': especializacion,
                    'anos_experiencia': anos_experiencia
                }
            )
            
            if created:
                self.stdout.write(f'✅ Perfil médico creado: Dr. {usuario.get_full_name()}')

    def create_pacientes(self):
        """Crear pacientes de prueba"""
        pacientes_data = [
            {
                'username': 'ana_lopez',
                'email': 'ana@email.com',
                'first_name': 'Ana',
                'last_name': 'López',
                'cedula': '1122334455',
                'fecha_nacimiento': '1985-05-15',
                'genero': 'F',
                'telefono': '0987654321'
            },
            {
                'username': 'juan_perez',
                'email': 'juan@email.com',
                'first_name': 'Juan',
                'last_name': 'Pérez',
                'cedula': '5544332211',
                'fecha_nacimiento': '1990-12-10',
                'genero': 'M',
                'telefono': '0912345678'
            },
            {
                'username': 'maria_garcia',
                'email': 'maria@email.com',
                'first_name': 'María',
                'last_name': 'García',
                'cedula': '6677889900',
                'fecha_nacimiento': '1988-03-20',
                'genero': 'F',
                'telefono': '0923456789'
            }
        ]

        for data in pacientes_data:
            paciente_data = data.copy()
            fecha_nacimiento = paciente_data.pop('fecha_nacimiento')
            genero = paciente_data.pop('genero')
            telefono = paciente_data.pop('telefono')
            
            usuario, created = User.objects.get_or_create(
                username=paciente_data['username'],
                defaults={
                    **paciente_data,
                    'password': 'testpass123',
                    'tipo_usuario': User.TipoUsuario.PACIENTE,
                    'fecha_nacimiento': fecha_nacimiento,
                    'genero': genero,
                    'telefono': telefono
                }
            )
            
            if created:
                usuario.set_password('testpass123')
                usuario.save()
                self.stdout.write(f'✅ Usuario paciente creado: {usuario.username}')
            
            paciente_profile, created = PacienteProfile.objects.get_or_create(
                usuario=usuario,
                defaults={}
            )
            
            if created:
                self.stdout.write(f'✅ Perfil paciente creado: {usuario.get_full_name()}')

    def create_episodios(self):
        """Crear episodios de cefalea de prueba"""
        pacientes = User.objects.filter(tipo_usuario=User.TipoUsuario.PACIENTE)
        
        episodios_data = [
            {
                'duracion_cefalea_horas': 6,
                'severidad': 'Severa',
                'localizacion': 'Unilateral',
                'caracter_dolor': 'Pulsátil',
                'empeora_actividad': True,
                'nauseas_vomitos': True,
                'fotofobia': True,
                'fonofobia': True,
                'presencia_aura': False,
                'categoria_diagnostica': 'Migraña sin aura'
            },
            {
                'duracion_cefalea_horas': 8,
                'severidad': 'Moderada',
                'localizacion': 'Unilateral',
                'caracter_dolor': 'Pulsátil',
                'empeora_actividad': True,
                'nauseas_vomitos': False,
                'fotofobia': True,
                'fonofobia': True,
                'presencia_aura': True,
                'sintomas_aura': 'Visuales',
                'duracion_aura_minutos': 30,
                'categoria_diagnostica': 'Migraña con aura'
            },
            {
                'duracion_cefalea_horas': 4,
                'severidad': 'Leve',
                'localizacion': 'Bilateral',
                'caracter_dolor': 'Opresivo',
                'empeora_actividad': False,
                'nauseas_vomitos': False,
                'fotofobia': False,
                'fonofobia': False,
                'presencia_aura': False,
                'categoria_diagnostica': 'Cefalea de tipo tensional'
            }
        ]

        for i, paciente in enumerate(pacientes[:3]):
            episodio_data = episodios_data[i % len(episodios_data)]
            episodio, created = EpisodioCefalea.objects.get_or_create(
                paciente=paciente,
                categoria_diagnostica=episodio_data['categoria_diagnostica'],
                defaults=episodio_data
            )
            
            if created:
                self.stdout.write(
                    f'✅ Episodio creado para {paciente.get_full_name()}: '
                    f'{episodio.categoria_diagnostica}'
                )

    def create_tratamientos(self):
        """Crear tratamientos de ejemplo"""
        episodios = EpisodioCefalea.objects.all()
        
        tratamientos_data = [
            {
                'medicamentos': [
                    {
                        'nombre': 'Sumatriptán',
                        'dosis': '100mg',
                        'caracteristica': 'Triptán para crisis aguda de migraña',
                        'frecuencia_horas': 24,
                        'duracion_dias': 3,
                        'hora_de_inicio': '08:00:00'
                    },
                    {
                        'nombre': 'Paracetamol',
                        'dosis': '500mg',
                        'caracteristica': 'Analgésico complementario',
                        'frecuencia_horas': 8,
                        'duracion_dias': 5,
                        'hora_de_inicio': '08:00:00'
                    }
                ],
                'recomendaciones': ['rutina_sueno', 'hidratacion', 'ambiente_oscuro'],
                'cumplimiento': 85.0
            },
            {
                'medicamentos': [
                    {
                        'nombre': 'Rizatriptán',
                        'dosis': '10mg',
                        'caracteristica': 'Triptán de acción rápida',
                        'frecuencia_horas': 24,
                        'duracion_dias': 2,
                        'hora_de_inicio': '07:00:00'
                    }
                ],
                'recomendaciones': ['rutina_sueno', 'ejercicio_moderado'],
                'cumplimiento': 92.0
            },
            {
                'medicamentos': [
                    {
                        'nombre': 'Ibuprofeno',
                        'dosis': '400mg',
                        'caracteristica': 'AINE para cefalea tensional',
                        'frecuencia_horas': 12,
                        'duracion_dias': 7,
                        'hora_de_inicio': '09:00:00'
                    }
                ],
                'recomendaciones': ['control_estres', 'ejercicio_moderado'],
                'cumplimiento': 60.0
            }
        ]

        for i, episodio in enumerate(episodios[:3]):
            if hasattr(episodio.paciente, 'perfil_paciente'):
                data = tratamientos_data[i % len(tratamientos_data)]
                
                tratamiento, created = Tratamiento.objects.get_or_create(
                    episodio=episodio,
                    paciente=episodio.paciente.perfil_paciente,
                    defaults={
                        'fecha_inicio': timezone.now() - timedelta(days=7),
                        'activo': True,
                        'cumplimiento': data['cumplimiento'],
                        'recomendaciones': data['recomendaciones']
                    }
                )
                
                if created:
                    # Crear medicamentos para el tratamiento
                    for med_data in data['medicamentos']:
                        medicamento = Medicamento.objects.create(**med_data)
                        tratamiento.medicamentos.add(medicamento)
                    
                    self.stdout.write(
                        f'✅ Tratamiento creado para {episodio.paciente.get_full_name()}: '
                        f'{len(data["medicamentos"])} medicamentos'
                    )

        self.stdout.write(
            self.style.SUCCESS('🎯 Datos de prueba completados!')
        )
        self.stdout.write('📋 Credenciales de prueba:')
        self.stdout.write('   Médicos: dr_gonzalez / dr_martinez (password: testpass123)')
        self.stdout.write('   Pacientes: ana_lopez / juan_perez / maria_garcia (password: testpass123)')
        self.stdout.write('   Superusuario: lulu2 (password: tu_password_configurado)')
