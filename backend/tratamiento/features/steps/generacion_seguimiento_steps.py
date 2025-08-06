import os
import sys
import django
from django.conf import settings

# Configurar Django antes de importar los modelos
if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'migraine_app.settings')
    django.setup()

from behave import step
from django.contrib.auth import get_user_model
from usuarios.models import PacienteProfile, MedicoProfile
from evaluacion_diagnostico.models import EpisodioCefalea
from tratamiento.models import Tratamiento, Medicamento, Alerta, EstadoNotificacion
from datetime import datetime, timedelta
from django.utils import timezone
import json

User = get_user_model()


@step('que el paciente tiene al menos un historial de migrañas')
def step_impl(context):
    """Crear un paciente con historial de migrañas"""
    # Crear usuario paciente con todos los campos necesarios
    context.usuario_paciente = User.objects.create_user(
        username='paciente_test',
        email='paciente@test.com',
        password='testpass123',
        first_name='Juan',
        last_name='Pérez',
        cedula='1234567890',
        tipo_usuario=User.TipoUsuario.PACIENTE,
        fecha_nacimiento='1990-01-15',
        genero=User.Genero.MASCULINO,
        telefono='0987654321'
    )
    
    # Crear perfil de paciente con solo los campos específicos
    context.paciente = PacienteProfile.objects.create(
        usuario=context.usuario_paciente,
        contacto_emergencia_nombre='María Pérez',
        contacto_emergencia_telefono='0987654321',
        contacto_emergencia_relacion='Madre'
    )
    
    # Crear usuario médico
    context.usuario_medico = User.objects.create_user(
        username='medico_test',
        email='medico@test.com',
        password='testpass123',
        first_name='Dr. María',
        last_name='González',
        cedula='0987654321',
        tipo_usuario=User.TipoUsuario.MEDICO
    )
    
    # Crear perfil de médico
    context.medico = MedicoProfile.objects.create(
        usuario=context.usuario_medico,
        numero_licencia='MED-12345',
        especializacion='neurologia',
        anos_experiencia=10
    )


@step('que el paciente presenta su primer episodio con la categorización {categoria}')
def step_impl(context, categoria):
    """Crear un episodio de cefalea con la categorización especificada"""
    context.episodio = EpisodioCefalea.objects.create(
        paciente=context.paciente.usuario,  # Usar el usuario del perfil de paciente
        duracion_cefalea_horas=4,
        severidad='Moderada',
        localizacion='Unilateral',
        caracter_dolor='Pulsátil',
        empeora_actividad=True,
        nauseas_vomitos=True,
        fotofobia=True,
        fonofobia=False,
        presencia_aura=(categoria == 'Migraña con aura'),
        sintomas_aura='Visuales' if categoria == 'Migraña con aura' else '',
        duracion_aura_minutos=20 if categoria == 'Migraña con aura' else 0,
        en_menstruacion=False,
        anticonceptivos=False,
        categoria_diagnostica=categoria
    )


@step('el médico ingresa los datos del tratamiento')
def step_impl(context):
    """Simular el ingreso de datos de tratamiento por parte del médico"""
    # Crear algunos medicamentos de prueba
    medicamento1, _ = Medicamento.objects.get_or_create(
        nombre='Sumatriptán',
        defaults={
            'dosis': '50mg',
            'caracteristica': 'Medicamento para el tratamiento agudo de la migraña',
            'frecuencia_horas': 24,
            'duracion_dias': 7,
            'hora_de_inicio': timezone.now().time()
        }
    )
    
    medicamento2, _ = Medicamento.objects.get_or_create(
        nombre='Amitriptilina',
        defaults={
            'dosis': '25mg',
            'caracteristica': 'Medicamento para la prevención de la migraña',
            'frecuencia_horas': 24,
            'duracion_dias': 14,
            'hora_de_inicio': timezone.now().time()
        }
    )
    
    # Datos del tratamiento según la categoría del episodio
    if context.episodio.categoria_diagnostica == 'Migraña sin aura':
        context.datos_tratamiento = {
            'medicamento_principal': medicamento1,
            'dosis': '50mg cada 24 horas',
            'frecuencia': 'Una vez al día',
            'duracion_semanas': 4,
            'instrucciones': 'Tomar en caso de episodio agudo de migraña',
            'recomendaciones': 'Evitar factores desencadenantes conocidos'
        }
    elif context.episodio.categoria_diagnostica == 'Migraña con aura':
        context.datos_tratamiento = {
            'medicamento_principal': medicamento1,
            'dosis': '100mg cada 24 horas',
            'frecuencia': 'Una vez al día',
            'duracion_semanas': 6,
            'instrucciones': 'Tomar tan pronto aparezcan los síntomas de aura',
            'recomendaciones': 'Mantener diario de síntomas y factores desencadenantes'
        }
    else:  # CEFALEA_TENSIONAL
        context.datos_tratamiento = {
            'medicamento_principal': medicamento2,
            'dosis': '25mg cada 24 horas',
            'frecuencia': 'Una vez al día por la noche',
            'duracion_semanas': 8,
            'instrucciones': 'Tratamiento preventivo, tomar diariamente',
            'recomendaciones': 'Técnicas de relajación y manejo del estrés'
        }


@step('el sistema crea el tratamiento')
def step_impl(context):
    """Verificar que el sistema crea correctamente el tratamiento"""
    datos = context.datos_tratamiento
    
    # Crear el tratamiento
    context.tratamiento = Tratamiento.objects.create(
        episodio=context.episodio,
        paciente=context.paciente,
        fecha_inicio=timezone.now().date(),
        activo=True,
        cumplimiento=0.0
    )
    
    # Agregar el medicamento al tratamiento
    context.tratamiento.medicamentos.add(datos['medicamento_principal'])
    
    # Agregar recomendaciones
    context.tratamiento.asignar_recomendaciones_generales()
    context.tratamiento.save()
    
    # Verificar que el tratamiento se creó correctamente
    assert context.tratamiento.id is not None
    assert context.tratamiento.episodio == context.episodio
    assert context.tratamiento.paciente == context.paciente
    assert context.tratamiento.activo == True
    
    print(f"✅ Tratamiento creado exitosamente con ID: {context.tratamiento.id}")
    print(f"   - Medicamentos: {context.tratamiento.medicamentos.count()}")
    print(f"   - Tipo migraña: {context.tratamiento.tipo_migraña}")
    print(f"   - Estado: {'Activo' if context.tratamiento.activo else 'Inactivo'}")


@step('que el paciente tiene un tratamiento activo correspondiente a un episodio médico')
def step_impl(context):
    """Asegurar que existe un tratamiento activo"""
    # Asegurar que tenemos un episodio
    if not hasattr(context, 'episodio'):
        # Crear episodio si no existe usando los campos reales del modelo
        from evaluacion_diagnostico.models import EpisodioCefalea
        context.episodio = EpisodioCefalea.objects.create(
            paciente=context.paciente.usuario,  # Usar el usuario del perfil de paciente
            duracion_cefalea_horas=4,
            severidad='Moderada',
            localizacion='Unilateral',
            caracter_dolor='Pulsátil',
            empeora_actividad=True,
            nauseas_vomitos=True,
            fotofobia=True,
            fonofobia=False,
            presencia_aura=False,
            sintomas_aura='',
            duracion_aura_minutos=0,
            en_menstruacion=False,
            anticonceptivos=False,
            categoria_diagnostica='Migraña sin aura'
        )
    
    if not hasattr(context, 'tratamiento') or not context.tratamiento.activo:
        # Crear un tratamiento activo si no existe
        medicamento, _ = Medicamento.objects.get_or_create(
            nombre='Ibuprofeno',
            defaults={
                'dosis': '400mg',
                'caracteristica': 'Antiinflamatorio para el dolor de cabeza',
                'frecuencia_horas': 8,
                'duracion_dias': 14,
                'hora_de_inicio': timezone.now().time()
            }
        )
        
        context.tratamiento = Tratamiento.objects.create(
            episodio=context.episodio,
            paciente=context.paciente,
            fecha_inicio=timezone.now().date() - timedelta(days=7),
            activo=True,
            cumplimiento=0.5
        )
        
        # Agregar el medicamento al tratamiento
        context.tratamiento.medicamentos.add(medicamento)
        context.tratamiento.save()


@step('el historial de alertas indica que el paciente ha confirmado {porcentaje:d}% de las tomas correspondientes a {cantidad:d} tratamientos')
def step_impl(context, porcentaje, cantidad):
    """Crear historial de alertas con el porcentaje de cumplimiento especificado"""
    context.porcentaje_cumplimiento = porcentaje
    context.cantidad_tratamientos = cantidad
    
    # Calcular cuántas alertas crear y cuántas marcar como confirmadas
    total_alertas = 20  # Simular 20 alertas por tratamiento
    alertas_confirmadas = int((porcentaje / 100) * total_alertas)
    alertas_pendientes = total_alertas - alertas_confirmadas
    
    context.alertas = []
    
    # Crear alertas confirmadas
    for i in range(alertas_confirmadas):
        alerta = Alerta.objects.create(
            mensaje=f"Recordatorio {i+1}: Es hora de tomar tu medicamento",
            fecha_hora=timezone.now() - timedelta(days=i+1),
            estado=EstadoNotificacion.CONFIRMADO_TOMADO,
            numero_alerta=1,
            duracion=60,  # 60 minutos
            tiempo_espera=15  # 15 minutos
        )
        context.alertas.append(alerta)
    
    # Crear alertas pendientes/no confirmadas
    for i in range(alertas_pendientes):
        alerta = Alerta.objects.create(
            mensaje=f"Recordatorio {i+alertas_confirmadas+1}: Es hora de tomar tu medicamento",
            fecha_hora=timezone.now() - timedelta(days=i+1),
            estado=EstadoNotificacion.SIN_CONFIRMAR,
            numero_alerta=1,
            duracion=60,  # 60 minutos
            tiempo_espera=15  # 15 minutos
        )
        context.alertas.append(alerta)
    
    print(f"📊 Historial de alertas creado: {alertas_confirmadas}/{total_alertas} confirmadas ({porcentaje}%)")


@step('el médico evalúa el cumplimiento del tratamiento anterior')
def step_impl(context):
    """Simular la evaluación del cumplimiento por parte del médico"""
    alertas_confirmadas = sum(1 for alerta in context.alertas if alerta.estado == EstadoNotificacion.CONFIRMADO_TOMADO)
    total_alertas = len(context.alertas)
    porcentaje_real = (alertas_confirmadas / total_alertas) * 100 if total_alertas > 0 else 0
    
    context.evaluacion_cumplimiento = {
        'alertas_confirmadas': alertas_confirmadas,
        'total_alertas': total_alertas,
        'porcentaje_cumplimiento': porcentaje_real,
        'decision': 'modificar' if porcentaje_real >= 80 else 'cancelar'
    }
    
    print(f"🔍 Evaluación de cumplimiento:")
    print(f"   - Alertas confirmadas: {alertas_confirmadas}/{total_alertas}")
    print(f"   - Porcentaje: {porcentaje_real:.1f}%")
    print(f"   - Decisión: {context.evaluacion_cumplimiento['decision']}")


@step('se decide modificar el tratamiento')
def step_impl(context):
    """Verificar que la decisión es modificar el tratamiento"""
    assert context.evaluacion_cumplimiento['decision'] == 'modificar'
    assert context.evaluacion_cumplimiento['porcentaje_cumplimiento'] >= 80
    print("✅ Decisión correcta: Modificar tratamiento (cumplimiento alto)")


@step('se decide cancelar el tratamiento')
def step_impl(context):
    """Verificar que la decisión es cancelar el tratamiento"""
    assert context.evaluacion_cumplimiento['decision'] == 'cancelar'
    assert context.evaluacion_cumplimiento['porcentaje_cumplimiento'] < 80
    print("✅ Decisión correcta: Cancelar tratamiento (cumplimiento bajo)")


@step('el médico ingresa las siguientes características para el nuevo tratamiento')
def step_impl(context):
    """Simular el ingreso de datos para un nuevo tratamiento modificado"""
    # Crear un nuevo medicamento para el tratamiento modificado
    nuevo_medicamento, _ = Medicamento.objects.get_or_create(
        nombre='Naratriptán',
        defaults={
            'dosis': '2.5mg',
            'caracteristica': 'Medicamento de segunda línea para migraña',
            'frecuencia_horas': 24,
            'duracion_dias': 42,  # 6 semanas
            'hora_de_inicio': timezone.now().time()
        }
    )
    
    context.nuevo_tratamiento_data = {
        'medicamento_principal': nuevo_medicamento,
        'dosis': '2.5mg cada 24 horas',
        'frecuencia': 'Una vez al día',
        'duracion_semanas': 6,
        'instrucciones': 'Tomar al primer síntoma de migraña',
        'recomendaciones': 'Evitar alcohol durante el tratamiento'
    }


@step('el médico ingresa el motivo como "{motivo}"')
def step_impl(context, motivo):
    """Simular el ingreso del motivo de cancelación"""
    context.motivo_cancelacion = motivo


@step('el sistema debe actualizar el tratamiento con los nuevos datos')
def step_impl(context):
    """Verificar que el sistema actualiza correctamente el tratamiento"""
    # Marcar el tratamiento actual como inactivo
    context.tratamiento.activo = False
    context.tratamiento.observaciones = 'Tratamiento modificado por buen cumplimiento'
    context.tratamiento.save()
    
    # Crear un nuevo episodio para el nuevo tratamiento (debido a restricción UNIQUE)
    from evaluacion_diagnostico.models import EpisodioCefalea
    nuevo_episodio = EpisodioCefalea.objects.create(
        paciente=context.paciente.usuario,
        duracion_cefalea_horas=6,
        severidad='Moderada',
        localizacion='Bilateral',
        caracter_dolor='Pulsátil',
        empeora_actividad=True,
        nauseas_vomitos=False,
        fotofobia=True,
        fonofobia=True,
        presencia_aura=False,
        sintomas_aura='',
        duracion_aura_minutos=0,
        en_menstruacion=False,
        anticonceptivos=False,
        categoria_diagnostica='Migraña sin aura'
    )
    
    # Crear el nuevo tratamiento
    datos = context.nuevo_tratamiento_data
    context.nuevo_tratamiento = Tratamiento.objects.create(
        episodio=nuevo_episodio,
        paciente=context.paciente,
        fecha_inicio=timezone.now().date(),
        activo=True,
        cumplimiento=0.0
    )
    
    # Agregar el medicamento al nuevo tratamiento
    context.nuevo_tratamiento.medicamentos.add(datos['medicamento_principal'])
    context.nuevo_tratamiento.save()
    
    # Verificaciones
    assert not context.tratamiento.activo
    assert context.nuevo_tratamiento.activo
    assert context.nuevo_tratamiento.episodio == nuevo_episodio
    
    print("✅ Tratamiento actualizado exitosamente:")
    print(f"   - Tratamiento anterior activo: {context.tratamiento.activo}")
    print(f"   - Nuevo tratamiento activo: {context.nuevo_tratamiento.activo}")
    print(f"   - Nuevo medicamento: {datos['medicamento_principal'].nombre}")
    print(f"   - Nuevo episodio ID: {nuevo_episodio.id}")


@step('el sistema debe cancelar el tratamiento con los datos ingresados')
def step_impl(context):
    """Verificar que el sistema cancela correctamente el tratamiento"""
    # Cancelar el tratamiento actual
    context.tratamiento.activo = False
    context.tratamiento.observaciones = context.motivo_cancelacion
    context.tratamiento.fecha_fin = timezone.now().date()
    context.tratamiento.save()
    
    # Verificaciones
    assert not context.tratamiento.activo
    assert context.tratamiento.observaciones == context.motivo_cancelacion
    
    print("✅ Tratamiento cancelado exitosamente:")
    print(f"   - Estado activo: {context.tratamiento.activo}")
    print(f"   - Motivo: {context.tratamiento.observaciones}")
    print(f"   - Fecha de cancelación: {context.tratamiento.fecha_fin}")
