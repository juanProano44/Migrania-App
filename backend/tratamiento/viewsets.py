from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from drf_spectacular.openapi import OpenApiParameter, OpenApiTypes

from .models import Tratamiento, Medicamento, Alerta, EstadoNotificacion
from .serializers import (
    TratamientoCreateSerializer,
    TratamientoSerializer,
    TratamientoResumenSerializer,
    TratamientoCancelarSerializer,
    TratamientoUpdateSerializer,
    MedicamentoSerializer,
    CumplimientoSerializer,
    EstadisticasTratamientoSerializer,
    ConfirmarTomaSerializer
)
from .services import TratamientoService
from .permissions import (
    EsMedico,
    EsPaciente,
    EsPropietarioDelTratamientoOPersonalMedico,
)
from usuarios.models import PacienteProfile


@extend_schema_view(
    list=extend_schema(
        summary="Listar tratamientos",
        description="Obtiene la lista de tratamientos según el tipo de usuario",
        parameters=[
            OpenApiParameter("paciente_id", OpenApiTypes.INT, description="ID del paciente"),
            OpenApiParameter("activo", OpenApiTypes.BOOL, description="Filtrar tratamientos activos"),
        ]
    ),
    create=extend_schema(
        summary="Crear nuevo tratamiento",
        description="Crea un nuevo tratamiento con medicamentos y recomendaciones"
    ),
    retrieve=extend_schema(
        summary="Obtener tratamiento",
        description="Obtiene los detalles de un tratamiento específico"
    ),
    update=extend_schema(
        summary="Actualizar tratamiento",
        description="Actualiza completamente un tratamiento existente"
    ),
    partial_update=extend_schema(
        summary="Actualizar parcialmente tratamiento",
        description="Actualiza parcialmente un tratamiento existente"
    ),
    destroy=extend_schema(
        summary="Eliminar tratamiento",
        description="Elimina un tratamiento del sistema"
    ),
)
class TratamientoViewSet(viewsets.ModelViewSet):
    queryset = Tratamiento.objects.select_related('paciente', 'episodio').prefetch_related('medicamentos').order_by('-fecha_inicio')

    def get_serializer_class(self):
        if self.action == 'create':
            return TratamientoCreateSerializer
        elif self.action == 'cancelar':
            return TratamientoCancelarSerializer
        elif self.action == 'update' or self.action == 'partial_update' or self.action == 'modificar':
            return TratamientoUpdateSerializer
        elif self.action == 'historial':
            return TratamientoResumenSerializer
        elif self.action == 'confirmar_toma':
            return ConfirmarTomaSerializer
        else:
            return TratamientoSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [EsMedico()]
        elif self.action in ['update', 'partial_update', 'destroy', 'modificar', 'cancelar']:
            return [EsMedico()]
        elif self.action in ['confirmar_toma', 'mis_tratamientos_activos']:
            return [EsPaciente()]
        else:  # list, retrieve, seguimiento, historial, cumplimiento, estadisticas
            return [EsPropietarioDelTratamientoOPersonalMedico()]

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset

        # Si es paciente, solo sus tratamientos
        if hasattr(user, 'perfil_paciente'):
            queryset = queryset.filter(paciente=user.perfil_paciente)
        
        # Filtros opcionales por query params
        paciente_id = self.request.query_params.get('paciente_id')
        if paciente_id and hasattr(user, 'perfil_medico'):
            # Buscar por ID del usuario paciente, no por ID del perfil
            queryset = queryset.filter(paciente__usuario__id=paciente_id)
        
        # También soportar filtro por 'paciente' para compatibilidad
        paciente_param = self.request.query_params.get('paciente')
        if paciente_param and hasattr(user, 'perfil_medico'):
            # Buscar por ID del usuario paciente
            queryset = queryset.filter(paciente__usuario__id=paciente_param)
        
        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')

        return queryset

    def perform_create(self, serializer):
        """Crear tratamiento y generar notificaciones automáticamente"""
        serializer.save()

    @action(detail=True, methods=['put'], url_path='cancelar')
    def cancelar(self, request, pk=None):
        """Cancelar un tratamiento activo"""
        tratamiento = self.get_object()
        
        if not tratamiento.activo:
            return Response(
                {'error': 'El tratamiento ya está inactivo'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(tratamiento, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Cancelar tratamiento y notificaciones
        serializer.save(activo=False, motivo_cancelacion=serializer.validated_data.get('motivo_cancelacion'))
        TratamientoService.cancelar_notificaciones(tratamiento)

        return Response({
            'message': 'Tratamiento cancelado exitosamente',
            'tratamiento': TratamientoSerializer(tratamiento).data
        })

    @action(detail=True, methods=['put'], url_path='modificar')
    def modificar(self, request, pk=None):
        """Modificar un tratamiento existente"""
        tratamiento = self.get_object()
        
        if not tratamiento.activo:
            return Response(
                {'error': 'No se puede modificar un tratamiento inactivo'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(tratamiento, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Cancelar notificaciones anteriores antes de modificar
        TratamientoService.cancelar_notificaciones(tratamiento)
        
        # Guardar cambios
        serializer.save()
        
        # Regenerar notificaciones con los nuevos datos
        tratamiento.generarNotificaciones()

        return Response({
            'message': 'Tratamiento modificado exitosamente',
            'tratamiento': TratamientoSerializer(tratamiento).data
        })

    @action(detail=False, methods=['get'], url_path='historial/(?P<paciente_id>[^/.]+)')
    def historial(self, request, paciente_id=None):
        """Obtener historial de tratamientos de un paciente"""
        try:
            paciente = PacienteProfile.objects.get(id=paciente_id)
        except PacienteProfile.DoesNotExist:
            return Response(
                {'error': 'Paciente no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        tratamientos = Tratamiento.objects.filter(paciente=paciente).order_by('-fecha_inicio')
        serializer = self.get_serializer(tratamientos, many=True)
        
        return Response({
            'paciente': {
                'id': paciente.id,
                'nombre': paciente.usuario.get_full_name()
            },
            'tratamientos': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='seguimiento/(?P<paciente_id>[^/.]+)')
    def seguimiento(self, request, paciente_id=None):
        """Obtener información de seguimiento de tratamientos activos"""
        try:
            paciente = PacienteProfile.objects.get(id=paciente_id)
        except PacienteProfile.DoesNotExist:
            return Response(
                {'error': 'Paciente no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        tratamientos_activos = Tratamiento.objects.filter(
            paciente=paciente, 
            activo=True
        ).order_by('-fecha_inicio')

        if not tratamientos_activos.exists():
            return Response({
                'paciente': {
                    'id': paciente.id,
                    'nombre': paciente.usuario.get_full_name()
                },
                'tratamientos_activos': [],
                'message': 'No hay tratamientos activos'
            })

        serializer = TratamientoSerializer(tratamientos_activos, many=True)
        
        return Response({
            'paciente': {
                'id': paciente.id,
                'nombre': paciente.usuario.get_full_name()
            },
            'tratamientos_activos': serializer.data
        })

    @action(detail=True, methods=['get'], url_path='cumplimiento')
    def cumplimiento(self, request, pk=None):
        """Obtener estadísticas de cumplimiento de un tratamiento"""
        tratamiento = self.get_object()
        
        # Calcular cumplimiento actualizado
        porcentaje = tratamiento.calcular_cumplimiento()
        
        # Obtener alertas del tratamiento
        alertas_tratamiento = Alerta.objects.filter(id__in=tratamiento.notificaciones_generadas)
        total_alertas = alertas_tratamiento.count()
        
        estados_cumplimiento = [
            EstadoNotificacion.CONFIRMADO_TOMADO,
            EstadoNotificacion.CONFIRMADO_TOMADO_TARDE,
            EstadoNotificacion.CONFIRMADO_TOMADO_MUY_TARDE
        ]
        
        alertas_cumplidas = alertas_tratamiento.filter(estado__in=estados_cumplimiento).count()
        alertas_perdidas = alertas_tratamiento.filter(estado=EstadoNotificacion.CONFIRMADO_NO_TOMADO).count()
        
        data = {
            'tratamiento_id': tratamiento.id,
            'porcentaje_cumplimiento': porcentaje,
            'total_alertas': total_alertas,
            'alertas_cumplidas': alertas_cumplidas,
            'alertas_perdidas': alertas_perdidas
        }
        
        serializer = CumplimientoSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='estadisticas')
    def estadisticas(self, request):
        """Obtener estadísticas generales de tratamientos"""
        user = request.user
        
        # Base queryset según el tipo de usuario
        if hasattr(user, 'perfil_paciente'):
            queryset = Tratamiento.objects.filter(paciente=user.perfil_paciente)
        else:
            queryset = Tratamiento.objects.all()
        
        # Estadísticas básicas
        total_tratamientos = queryset.count()
        tratamientos_activos = queryset.filter(activo=True).count()
        tratamientos_finalizados = queryset.filter(activo=False).count()
        
        # Cumplimiento promedio
        cumplimiento_promedio = queryset.aggregate(
            promedio=Avg('cumplimiento')
        )['promedio'] or 0
        
        # Medicamentos más usados
        medicamentos_stats = Medicamento.objects.filter(
            tratamientos__in=queryset
        ).annotate(
            uso_count=Count('tratamientos')
        ).order_by('-uso_count')[:5]
        
        medicamentos_mas_usados = [
            {'nombre': med.nombre, 'veces_usado': med.uso_count}
            for med in medicamentos_stats
        ]
        
        data = {
            'total_tratamientos': total_tratamientos,
            'tratamientos_activos': tratamientos_activos,
            'tratamientos_finalizados': tratamientos_finalizados,
            'cumplimiento_promedio': round(cumplimiento_promedio, 2),
            'medicamentos_mas_usados': medicamentos_mas_usados
        }
        
        serializer = EstadisticasTratamientoSerializer(data)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='confirmar-toma')
    def confirmar_toma(self, request, pk=None):
        """Confirmar toma de medicamento por parte del paciente"""
        tratamiento = self.get_object()
        
        # Verificar que el usuario es el paciente del tratamiento
        if not hasattr(request.user, 'perfil_paciente') or tratamiento.paciente != request.user.perfil_paciente:
            return Response(
                {'error': 'No tienes permiso para confirmar tomas de este tratamiento'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        alerta_id = serializer.validated_data['alerta_id']
        estado_confirmacion = serializer.validated_data['estado']
        
        try:
            alerta = Alerta.objects.get(id=alerta_id, id__in=tratamiento.notificaciones_generadas)
        except Alerta.DoesNotExist:
            return Response(
                {'error': 'Alerta no encontrada o no pertenece a este tratamiento'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Mapear estados
        estado_map = {
            'tomado': EstadoNotificacion.CONFIRMADO_TOMADO,
            'no_tomado': EstadoNotificacion.CONFIRMADO_NO_TOMADO,
            'tomado_tarde': EstadoNotificacion.CONFIRMADO_TOMADO_TARDE,
            'tomado_muy_tarde': EstadoNotificacion.CONFIRMADO_TOMADO_MUY_TARDE
        }
        
        # Confirmar toma
        exito = tratamiento.confirmarToma(alerta, estado_map[estado_confirmacion])
        
        if exito:
            return Response({
                'message': 'Toma confirmada exitosamente',
                'cumplimiento_actualizado': tratamiento.cumplimiento
            })
        else:
            return Response(
                {'error': 'Error al confirmar la toma'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='mis-tratamientos-activos')
    def mis_tratamientos_activos(self, request):
        """Obtener tratamientos activos del paciente logueado"""
        if not hasattr(request.user, 'perfil_paciente'):
            return Response(
                {'error': 'Solo los pacientes pueden acceder a esta información'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        tratamientos = Tratamiento.objects.filter(
            paciente=request.user.perfil_paciente,
            activo=True
        ).order_by('-fecha_inicio')
        
        serializer = TratamientoSerializer(tratamientos, many=True)
        return Response(serializer.data)


class MedicamentoViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet de solo lectura para medicamentos"""
    queryset = Medicamento.objects.all()
    serializer_class = MedicamentoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='mas-usados')
    def mas_usados(self, request):
        """Obtener los medicamentos más utilizados"""
        medicamentos = self.queryset.annotate(
            uso_count=Count('tratamientos')
        ).filter(uso_count__gt=0).order_by('-uso_count')[:10]
        
        serializer = self.get_serializer(medicamentos, many=True)
        return Response(serializer.data)
    def cancelar(self, request, pk=None):
        tratamiento = self.get_object()
        serializer = self.get_serializer(tratamiento, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        serializer.save(activo=False, motivo_cancelacion=serializer.validated_data.get('motivo_cancelacion'))
        TratamientoService.cancelar_notificaciones(tratamiento)

        return Response(serializer.data)

    @action(detail=True, methods=['put'], url_path='modificar')
    def modificar(self, request, pk=None):
        tratamiento = self.get_object()
        serializer = self.get_serializer(tratamiento, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        TratamientoService.cancelar_notificaciones(tratamiento)

        return Response(TratamientoSerializer(tratamiento).data)

    @action(detail=False, methods=['get'], url_path='historial/(?P<paciente_id>[^/.]+)')
    def historial(self, request, paciente_id=None):
        tratamientos = Tratamiento.objects.filter(paciente_id=paciente_id).order_by('-fecha_inicio')
        serializer = self.get_serializer(tratamientos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='primera-consulta/(?P<paciente_id>[^/.]+)')
    def primera_consulta(self, request, paciente_id=None):
        ultimo_tratamiento = Tratamiento.objects.filter(paciente_id=paciente_id).order_by('-fecha_inicio').first()
        data = {
            'num_episodio': ultimo_tratamiento.id if ultimo_tratamiento else None,
            'tipo_episodio': getattr(ultimo_tratamiento, 'tipo_migraña', None),
            'fecha': ultimo_tratamiento.fecha_inicio if ultimo_tratamiento else None,
        }
        return Response(data)

    @action(detail=False, methods=['get'], url_path='seguimiento/(?P<paciente_id>[^/.]+)')
    def seguimiento(self, request, paciente_id=None):
        tratamiento = Tratamiento.objects.filter(paciente_id=paciente_id, activo=True).order_by('-fecha_inicio').first()
        if not tratamiento:
            return Response({'estado': 'Sin tratamiento activo'}, status=status.HTTP_200_OK)

        data = {
            'num_episodio': tratamiento.id,
            'tipo_episodio': getattr(tratamiento, 'tipo_migraña', None),
            'fecha': tratamiento.fecha_inicio,
            'estado': 'Activo',
            'cumplimiento': tratamiento.cumplimiento,
        }
        return Response(data)