from django.db import models
from django.utils import timezone
from collections import deque
from datetime import datetime, timedelta
import logging

from usuarios.models import PacienteProfile
from evaluacion_diagnostico.models import  EpisodioCefalea

logger = logging.getLogger(__name__)


class EstadoNotificacion(models.TextChoices):
    ACTIVO = 'activo'
    SIN_CONFIRMAR = 'sin_confirmar'
    CONFIRMADO_TOMADO = 'tomado'
    CONFIRMADO_NO_TOMADO = 'no_tomado'
    CONFIRMADO_TOMADO_TARDE = 'tomado_tarde'
    CONFIRMADO_TOMADO_MUY_TARDE = 'tomado_muy_tarde'


class BicolaNotificacion:
    """Clase separada para manejar la bicola de notificaciones"""

    def __init__(self):
        self.elementos = deque()

    def agregarFrente(self, elemento):
        self.elementos.appendleft(elemento)

    def agregarFinal(self, elemento):
        self.elementos.append(elemento)
        self.ordenar()

    def eliminarFrente(self):
        if self.elementos:
            return self.elementos.popleft()
        return None

    def eliminarFinal(self):
        if self.elementos:
            return self.elementos.pop()
        return None

    def verFrente(self):
        return self.elementos[0] if self.elementos else None

    def verFinal(self):
        return self.elementos[-1] if self.elementos else None

    def estaVacia(self):
        return len(self.elementos) == 0

    def ordenar(self):
        # Importación tardía para evitar referencias circulares
        from .models import Alerta

        alertas_frente = []
        while (len(self.elementos) > 0 and
               isinstance(self.elementos[0], Alerta) and
               self.elementos[0].numero_alerta > 1):
            alertas_frente.append(self.elementos.popleft())

        self.elementos = deque(sorted(self.elementos, key=lambda n: n.fecha_hora))

        for alerta in reversed(alertas_frente):
            self.elementos.appendleft(alerta)

    def agregar_multiples(self, elementos):
        self.elementos.extend(elementos)
        self.ordenar()

    def __len__(self):
        return len(self.elementos)

    def listar_elementos(self):
        return list(self.elementos)


class Notificacion(models.Model):
    mensaje = models.CharField(max_length=255)
    fecha_hora = models.DateTimeField()
    estado = models.CharField(max_length=30, choices=EstadoNotificacion.choices, default=EstadoNotificacion.ACTIVO)

    class Meta:
        abstract = True

    def enviar(self):
        raise NotImplementedError("Las subclases deben implementar este método")

    def obtenerEstado(self):
        return self.estado

    def asignarEstado(self, estado):
        self.estado = estado
        self.save()

    def esHoraDeEnvio(self, ahora):
        return ahora >= self.fecha_hora

    def actualizarEstadoSegunTiempo(self, ahora):
        pass

    def __str__(self):
        return f"{self.__class__.__name__}: {self.mensaje} - {self.estado}"


class Alerta(Notificacion):
    numero_alerta = models.IntegerField()
    duracion = models.IntegerField()
    tiempo_espera = models.IntegerField()

    def enviar(self):
        if self.estado == EstadoNotificacion.ACTIVO:
            self.estado = EstadoNotificacion.SIN_CONFIRMAR
            self.save()
            logger.info(f"Alerta enviada: {self.mensaje} - Número: {self.numero_alerta}")
            return True
        return False

    def reenviar(self, bicola):
        siguiente_numero = self.numero_alerta + 1

        if siguiente_numero > 3:
            self.estado = EstadoNotificacion.CONFIRMADO_NO_TOMADO
            self.save()
            logger.info(f"Máximo de alertas alcanzado. Marcando como no tomado: {self.mensaje}")
            return None

        nueva_alerta = Alerta(
            mensaje=f"{self.mensaje} (Alerta #{siguiente_numero})",
            fecha_hora=timezone.now(),
            estado=EstadoNotificacion.ACTIVO,
            numero_alerta=siguiente_numero,
            duracion=self.duracion,
            tiempo_espera=self.tiempo_espera
        )
        nueva_alerta.save()

        bicola.agregarFrente(nueva_alerta)
        logger.info(f"Nueva alerta generada: {nueva_alerta.mensaje} - Número: {nueva_alerta.numero_alerta}")
        return nueva_alerta

    def haExcedidoHoraDeConfirmacion(self):
        ahora = timezone.now()
        tiempo_transcurrido = (ahora - self.fecha_hora).total_seconds() / 60
        return tiempo_transcurrido > self.duracion

    def actualizarEstadoSegunTiempo(self, ahora):
        if self.estado == EstadoNotificacion.ACTIVO:
            self.estado = EstadoNotificacion.SIN_CONFIRMAR
            self.save()

        tiempo_transcurrido = (ahora - self.fecha_hora).total_seconds() / 60

        if tiempo_transcurrido > self.duracion and self.estado == EstadoNotificacion.SIN_CONFIRMAR:
            return True

        return False


class Recordatorio(Notificacion):
    def enviar(self):
        logger.info(f"Recordatorio enviado: {self.mensaje}")
        return True

    def actualizarEstadoSegunTiempo(self, ahora):
        return False


class Recomendacion(models.TextChoices):
    RUTINA_SUENO = "rutina_sueno", "Mantener una rutina regular de sueño"
    EJERCICIO_MODERADO = "ejercicio_moderado", "Realizar ejercicio de forma moderada"
    CONTROL_ESTRES = "control_estres", "Controlar los niveles de estrés"
    HIDRATACION = "hidratacion", "Mantener una hidratación adecuada"
    AMBIENTE_OSCURO = "ambiente_oscuro", "Buscar un ambiente oscuro y silencioso"
    COMPRESION = "compresion", "Aplicar compresión fría o tibia"
    EVITAR_ESFUERZO = "evitar_esfuerzo", "Evitar esfuerzo físico durante el episodio"
    NAUSEAS_VOMITOS = "nauseas_vomitos", "Líquidos en pequeñas cantidades y evitar alimentos pesados"

    # Exclusivas para mujeres
    MENSTRUACION = "menstruacion", "Usar analgésicos adecuados durante la menstruación"
    ANTICONCEPTIVOS = "anticonceptivos", "Consultar con un ginecólogo sobre anticonceptivos hormonales"

    def __str__(self):
        return f"{self.descripcion} ({self.get_aplicable_a_display()})"


class Medicamento(models.Model):
    nombre = models.CharField(max_length=100)
    dosis = models.CharField(max_length=50)
    caracteristica = models.CharField(max_length=100, blank=True)
    frecuencia_horas = models.IntegerField(default=8)
    duracion_dias = models.IntegerField()
    hora_de_inicio = models.TimeField()

    def calcularFechasDeTomas(self, fecha_inicio=None):
        if fecha_inicio is None:
            fecha_inicio = timezone.now().date()
        fechas_tomas = []
        for dia in range(self.duracion_dias):
            fecha_actual = fecha_inicio + timedelta(days=dia)
            tomas_por_dia = 24 // self.frecuencia_horas
            for i in range(tomas_por_dia):
                hora_toma = timezone.make_aware(datetime.combine(fecha_actual, self.hora_de_inicio)) + timedelta(
                    hours=i * self.frecuencia_horas)
                fechas_tomas.append(hora_toma)
        return sorted(fechas_tomas)

    def calcularRecordatorios(self, fechas_tomas):
        return [fecha_toma - timedelta(minutes=30) for fecha_toma in fechas_tomas]

    def __str__(self):
        return f"{self.nombre} ({self.dosis})"


class Tratamiento(models.Model):
    episodio = models.OneToOneField(
        EpisodioCefalea,
        on_delete=models.CASCADE,
        related_name='tratamiento',
        verbose_name='Episodio de Cefalea',
        null=True,
        blank=True
    )
    paciente = models.ForeignKey(
        PacienteProfile,
        on_delete=models.CASCADE,
        related_name='tratamientos',
        verbose_name='Paciente'
    )

    medicamentos = models.ManyToManyField('Medicamento', blank=True, related_name='tratamientos')
    recomendaciones = models.JSONField(default=list)
    observaciones = models.TextField(blank=True, null=True, help_text="Observaciones adicionales del tratamiento")
    notificaciones_generadas = models.JSONField(default=list, verbose_name='IDs de Notificaciones')
    fecha_inicio = models.DateField(default=timezone.now)
    activo = models.BooleanField(default=True)
    cumplimiento = models.FloatField(default=0.0)
    motivo_cancelacion = models.TextField(blank=True, null=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.id_tratamiento = None

    def _get_bicola(self):
        if not hasattr(self, '_bicola_notificacion'):
            self._bicola_notificacion = BicolaNotificacion()
        return self._bicola_notificacion

    @property
    def tipo_migraña(self):
        return self.episodio.categoria_diagnostica if self.episodio else "Sin episodio"

    @property
    def bicola_notificacion(self):
        return self._get_bicola()

    @property
    def porcentaje_cumplimiento(self):
        return self.cumplimiento

    def asignar_recomendaciones_generales(self):
        self.recomendaciones = [
            Recomendacion.RUTINA_SUENO,
            Recomendacion.EJERCICIO_MODERADO,
            Recomendacion.CONTROL_ESTRES,
            Recomendacion.HIDRATACION,
            Recomendacion.AMBIENTE_OSCURO,
            Recomendacion.COMPRESION,
            Recomendacion.EVITAR_ESFUERZO,
            Recomendacion.NAUSEAS_VOMITOS,
        ]


    def agregar_recomendaciones_para_mujer(self):
        self.recomendaciones.append(Recomendacion.MENSTRUACION)
        self.recomendaciones.append(Recomendacion.ANTICONCEPTIVOS)

    def generarNotificaciones(self, dias_anticipacion=7):
        todas_notificaciones = []
        fecha_limite = None

        if dias_anticipacion > 0:
            fecha_limite = timezone.now() + timedelta(days=dias_anticipacion)

        for medicamento in self.medicamentos.all():
            fechas_tomas = medicamento.calcularFechasDeTomas(self.fecha_inicio)
            if fecha_limite:
                fechas_tomas = [f for f in fechas_tomas if f <= fecha_limite]

            recordatorios = medicamento.calcularRecordatorios(fechas_tomas)

            for fr in recordatorios:
                r = Recordatorio(
                    mensaje=f"Recordatorio para tomar {medicamento.nombre} ({medicamento.dosis})",
                    fecha_hora=fr,
                    estado=EstadoNotificacion.ACTIVO
                )
                r.save()
                todas_notificaciones.append(r)

            for ft in fechas_tomas:
                a = Alerta(
                    mensaje=f"Es hora de tomar {medicamento.nombre} ({medicamento.dosis})",
                    fecha_hora=ft,
                    estado=EstadoNotificacion.ACTIVO,
                    numero_alerta=1,
                    duracion=15,
                    tiempo_espera=15
                )
                a.save()
                todas_notificaciones.append(a)

        for rec in self.recomendaciones:
            for i in range(dias_anticipacion):
                fecha = timezone.now().date() + timedelta(days=i)
                hora = timezone.make_aware(datetime.combine(fecha, datetime.min.time().replace(hour=9)))
                r = Recordatorio(
                    mensaje=f"Recordatorio de recomendación: {rec}",
                    fecha_hora=hora,
                    estado=EstadoNotificacion.ACTIVO
                )
                r.save()
                todas_notificaciones.append(r)

        # Guardar los IDs de las notificaciones generadas
        self.notificaciones_generadas = [n.id for n in todas_notificaciones]
        self.save()

        logger.info(f"Generadas {len(todas_notificaciones)} notificaciones para el tratamiento.")
        return todas_notificaciones


    def confirmarToma(self, notificacion, estado):
        if not isinstance(notificacion, Alerta):
            logger.warning("Notificación no válida")
            return False
        notificacion.estado = estado
        notificacion.save()
        # actualizar cumplimiento al confirmar
        self.calcular_cumplimiento()
        return True


    def calcularDuracion(self):
        if self.medicamentos.exists():
            return max(m.duracion_dias for m in self.medicamentos.all())
        return 0


    def estaActivo(self):
        if not self.activo:
            return False
        duracion = self.calcularDuracion()
        if duracion > 0 and self.fecha_inicio:
            fecha_fin = self.fecha_inicio + timedelta(days=duracion)
            return timezone.now().date() <= fecha_fin
        return True


    def obtenerSiguienteNotificacion(self):
        return self.bicola_notificacion.verFrente()


    def obtenerNotificacionesPendientes(self):
        return self.bicola_notificacion.listar_elementos()


    def procesarNotificacionesPendientes(self):
        if not self.estaActivo():
            logger.info(f"No se procesaron notificaciones porque el tratamiento no está activo")
            return []

        ahora = timezone.now()
        notificaciones_procesadas = []

        while not self.bicola_notificacion.estaVacia():
            notificacion = self.bicola_notificacion.verFrente()
            if notificacion.esHoraDeEnvio(ahora):
                notificacion_actual = self.bicola_notificacion.eliminarFrente()
                notificaciones_procesadas.append(notificacion_actual)

                notificacion_actual.enviar()

                if (isinstance(notificacion_actual, Alerta) and
                        notificacion_actual.estado == EstadoNotificacion.SIN_CONFIRMAR and
                        notificacion_actual.haExcedidoHoraDeConfirmacion()):
                    notificacion_actual.reenviar(self.bicola_notificacion)
            else:
                break

        return notificaciones_procesadas

    def calcular_cumplimiento(self):
        alertas_tratamiento = Alerta.objects.filter(id__in=self.notificaciones_generadas        )

        if not alertas_tratamiento.exists():
            return 0.0

        total_alertas = alertas_tratamiento.count()

        # Estados que consideramos como "cumplimiento positivo"
        estados_cumplimiento = [
            EstadoNotificacion.CONFIRMADO_TOMADO,
            EstadoNotificacion.CONFIRMADO_TOMADO_TARDE,
            EstadoNotificacion.CONFIRMADO_TOMADO_MUY_TARDE
        ]

        # Contar alertas confirmadas como tomadas (en cualquier momento)
        alertas_cumplidas = alertas_tratamiento.filter(estado__in=estados_cumplimiento).count()

        # Calcular porcentaje
        porcentaje_cumplimiento = (alertas_cumplidas / total_alertas) * 100

        # Actualizar el campo cumplimiento del modelo
        self.cumplimiento = round(porcentaje_cumplimiento, 2)
        self.save(update_fields=['cumplimiento'])

        return self.cumplimiento

    def __str__(self):
        return f"Tratamiento {self.id} - Medicamentos: {self.medicamentos.count()}"

