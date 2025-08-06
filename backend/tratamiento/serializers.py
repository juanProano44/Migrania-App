from rest_framework import serializers
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field

from .models import Tratamiento, Medicamento, Recomendacion
from usuarios.models import PacienteProfile, MedicoProfile
from evaluacion_diagnostico.models import EpisodioCefalea

User = get_user_model()


class MedicamentoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear medicamentos en un tratamiento"""
    
    class Meta:
        model = Medicamento
        fields = [
            'nombre', 'dosis', 'caracteristica',
            'frecuencia_horas', 'duracion_dias', 'hora_de_inicio'
        ]

    def validate_frecuencia_horas(self, value):
        if value <= 0 or value > 168:  # Máximo una semana
            raise serializers.ValidationError("La frecuencia debe estar entre 1 y 168 horas.")
        return value

    def validate_duracion_dias(self, value):
        if value <= 0 or value > 365:  # Máximo un año
            raise serializers.ValidationError("La duración debe estar entre 1 y 365 días.")
        return value


class MedicamentoSerializer(serializers.ModelSerializer):
    """Serializer para mostrar información de medicamentos"""
    
    class Meta:
        model = Medicamento
        fields = [
            'id', 'nombre', 'dosis', 'caracteristica',
            'frecuencia_horas', 'duracion_dias', 'hora_de_inicio'
        ]


class TratamientoCreateSerializer(serializers.ModelSerializer):
    medicamentos = MedicamentoCreateSerializer(many=True)
    recomendaciones = serializers.ListField(
        child=serializers.CharField(max_length=200), 
        required=False, 
        default=list,
        help_text="Lista de recomendaciones para el tratamiento"
    )
    paciente = serializers.PrimaryKeyRelatedField(
        queryset=PacienteProfile.objects.all(),
        help_text="ID del paciente para el tratamiento"
    )
    episodio = serializers.PrimaryKeyRelatedField(
        queryset=EpisodioCefalea.objects.all(),
        required=False,
        allow_null=True,
        help_text="ID del episodio de cefalea (opcional)"
    )

    class Meta:
        model = Tratamiento
        fields = [
            'episodio', 'paciente', 'medicamentos', 
            'recomendaciones', 'observaciones', 'fecha_inicio'
        ]

    def validate_medicamentos(self, value):
        if not value:
            raise serializers.ValidationError("Debe incluir al menos un medicamento.")
        return value

    def create(self, validated_data):
        medicamentos_data = validated_data.pop('medicamentos', [])
        recomendaciones_data = validated_data.pop('recomendaciones', [])
        
        # Crear el tratamiento
        tratamiento = Tratamiento.objects.create(**validated_data)

        # Crear y asociar medicamentos
        for med_data in medicamentos_data:
            medicamento = Medicamento.objects.create(**med_data)
            tratamiento.medicamentos.add(medicamento)

        # Asignar recomendaciones
        tratamiento.recomendaciones = recomendaciones_data
        tratamiento.save()

        # Generar notificaciones automáticamente
        tratamiento.generarNotificaciones()

        return tratamiento


class TratamientoUpdateSerializer(serializers.ModelSerializer):
    medicamentos = MedicamentoCreateSerializer(many=True, required=False)
    recomendaciones = serializers.ListField(
        child=serializers.CharField(max_length=200), 
        required=False,
        help_text="Lista de recomendaciones actualizadas"
    )
    observaciones = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    class Meta:
        model = Tratamiento
        fields = [
            'medicamentos', 'recomendaciones', 'observaciones', 'activo'
        ]

    def update(self, instance, validated_data):
        medicamentos_data = validated_data.pop('medicamentos', None)
        recomendaciones_data = validated_data.pop('recomendaciones', None)

        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Actualizar medicamentos si se proporcionan
        if medicamentos_data is not None:
            # Limpiar medicamentos anteriores
            instance.medicamentos.clear()
            
            # Crear nuevos medicamentos
            for med_data in medicamentos_data:
                medicamento = Medicamento.objects.create(**med_data)
                instance.medicamentos.add(medicamento)

        # Actualizar recomendaciones si se proporcionan
        if recomendaciones_data is not None:
            instance.recomendaciones = recomendaciones_data

        instance.save()
        return instance


class TratamientoCancelarSerializer(serializers.ModelSerializer):
    motivo_cancelacion = serializers.CharField(required=True, max_length=500)

    class Meta:
        model = Tratamiento
        fields = ['motivo_cancelacion']

    def validate_motivo_cancelacion(self, value):
        if not value or len(value.strip()) < 10:
            raise serializers.ValidationError(
                "El motivo de cancelación debe tener al menos 10 caracteres."
            )
        return value


class PacienteBasicoSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = PacienteProfile
        fields = ['id', 'nombre_completo']


class EpisodioBasicoSerializer(serializers.ModelSerializer):
    """Serializer básico para mostrar información de episodios de cefalea"""
    
    class Meta:
        model = EpisodioCefalea
        fields = ['id', 'categoria_diagnostica', 'creado_en', 'severidad']


class TratamientoSerializer(serializers.ModelSerializer):
    """Serializer completo para mostrar tratamientos"""
    medicamentos = MedicamentoSerializer(many=True, read_only=True)
    paciente = PacienteBasicoSerializer(read_only=True)
    episodio = EpisodioBasicoSerializer(read_only=True)
    esta_activo = serializers.SerializerMethodField()
    duracion_total = serializers.SerializerMethodField()
    recomendaciones_display = serializers.SerializerMethodField()

    class Meta:
        model = Tratamiento
        fields = [
            'id', 'episodio', 'paciente', 'medicamentos', 
            'recomendaciones', 'recomendaciones_display', 'observaciones', 'fecha_inicio', 'activo', 
            'cumplimiento', 'motivo_cancelacion',
            'esta_activo', 'duracion_total'
        ]

    @extend_schema_field(serializers.BooleanField)
    def get_esta_activo(self, obj):
        return obj.estaActivo()

    @extend_schema_field(serializers.IntegerField)
    def get_duracion_total(self, obj):
        return obj.calcularDuracion()

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_recomendaciones_display(self, obj):
        return obj.recomendaciones if obj.recomendaciones else []


class TratamientoResumenSerializer(serializers.ModelSerializer):
    """Serializer para vistas de resumen e historial"""
    paciente = PacienteBasicoSerializer(read_only=True)
    episodio = EpisodioBasicoSerializer(read_only=True)
    esta_activo = serializers.SerializerMethodField()
    numero_medicamentos = serializers.SerializerMethodField()

    class Meta:
        model = Tratamiento
        fields = [
            'id', 'episodio', 'paciente', 'fecha_inicio', 
            'activo', 'cumplimiento',
            'esta_activo', 'numero_medicamentos'
        ]

    @extend_schema_field(serializers.BooleanField)
    def get_esta_activo(self, obj):
        return obj.estaActivo()

    @extend_schema_field(serializers.IntegerField)
    def get_numero_medicamentos(self, obj):
        return obj.medicamentos.count()


class CumplimientoSerializer(serializers.Serializer):
    """Serializer para estadísticas de cumplimiento"""
    tratamiento_id = serializers.IntegerField()
    porcentaje_cumplimiento = serializers.FloatField()
    total_alertas = serializers.IntegerField()
    alertas_cumplidas = serializers.IntegerField()
    alertas_perdidas = serializers.IntegerField()


class EstadisticasTratamientoSerializer(serializers.Serializer):
    """Serializer para estadísticas generales de tratamientos"""
    total_tratamientos = serializers.IntegerField()
    tratamientos_activos = serializers.IntegerField()
    tratamientos_finalizados = serializers.IntegerField()
    cumplimiento_promedio = serializers.FloatField()
    medicamentos_mas_usados = serializers.ListField()


class ConfirmarTomaSerializer(serializers.Serializer):
    """Serializer para confirmar toma de medicamento"""
    alerta_id = serializers.IntegerField()
    estado = serializers.ChoiceField(choices=[
        ('tomado', 'Tomado'),
        ('no_tomado', 'No tomado'),
        ('tomado_tarde', 'Tomado tarde'),
        ('tomado_muy_tarde', 'Tomado muy tarde')
    ])
    fecha_confirmacion = serializers.DateTimeField(required=False)
