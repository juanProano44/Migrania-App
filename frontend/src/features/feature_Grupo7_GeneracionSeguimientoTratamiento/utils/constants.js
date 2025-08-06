// Constantes para la feature de generación y seguimiento de tratamiento

/**
 * Estados posibles de un tratamiento
 */
export const ESTADOS_TRATAMIENTO = {
    ACTIVO: 'activo',
    FINALIZADO: 'finalizado',
    SUSPENDIDO: 'suspendido',
    PAUSADO: 'pausado',
    CANCELADO: 'cancelado'
};

/**
 * Estados de notificaciones/alertas de medicamentos
 */
export const ESTADOS_NOTIFICACION = {
    ACTIVO: 'activo',
    SIN_CONFIRMAR: 'sin_confirmar',
    CONFIRMADO_TOMADO: 'confirmado_tomado',
    CONFIRMADO_NO_TOMADO: 'confirmado_no_tomado',
    CONFIRMADO_TOMADO_TARDE: 'confirmado_tomado_tarde',
    CONFIRMADO_TOMADO_MUY_TARDE: 'confirmado_tomado_muy_tarde'
};

/**
 * Tipos de migraña soportados
 */
export const TIPOS_MIGRANA = {
    SIN_AURA: 'Migraña sin aura',
    CON_AURA: 'Migraña con aura',
    CEFALEA_TENSIONAL: 'Cefalea de tipo tensional'
};

/**
 * Campos booleanos en el formulario de tratamiento
 */
export const BOOLEAN_FIELDS = [
    'activo',
    'requiere_receta',
    'es_urgente'
];

/**
 * Campos requeridos para crear un tratamiento
 */
export const REQUIRED_FIELDS = [
    'paciente',
    'fecha_inicio'
];

/**
 * Campos requeridos para medicamentos
 */
export const REQUIRED_MEDICAMENTO_FIELDS = [
    'nombre',
    'dosis',
    'frecuencia_horas',
    'duracion_dias'
];

/**
 * Frecuencias comunes de medicamentos (en horas)
 */
export const FRECUENCIAS_MEDICAMENTOS = [
    { value: 4, label: 'Cada 4 horas', display: 'C/4h' },
    { value: 6, label: 'Cada 6 horas', display: 'C/6h' },
    { value: 8, label: 'Cada 8 horas', display: 'C/8h' },
    { value: 12, label: 'Cada 12 horas', display: 'C/12h' },
    { value: 24, label: 'Una vez al día', display: 'Diario' }
];

/**
 * Duraciones comunes de tratamiento (en días)
 */
export const DURACIONES_TRATAMIENTO = [
    { value: 3, label: '3 días' },
    { value: 7, label: '1 semana' },
    { value: 14, label: '2 semanas' },
    { value: 21, label: '3 semanas' },
    { value: 30, label: '1 mes' }
];

/**
 * Medicamentos comunes para migraña
 */
export const MEDICAMENTOS_COMUNES = {
    ANALGESICOS: [
        'Ibuprofeno',
        'Paracetamol',
        'Naproxeno',
        'Diclofenaco'
    ],
    TRIPTANOS: [
        'Sumatriptán',
        'Rizatriptán',
        'Zolmitriptán',
        'Eletriptán'
    ],
    PREVENTIVOS: [
        'Propranolol',
        'Topiramate',
        'Amitriptilina',
        'Valproato'
    ]
};

/**
 * Recomendaciones base por género
 */
export const RECOMENDACIONES_BASE = {
    COMUNES: [
        "Mantener una rutina regular de sueño",
        "Evitar factores desencadenantes conocidos",
        "Mantener una hidratación adecuada",
        "Practicar técnicas de relajación y manejo del estrés",
        "Llevar un diario de cefaleas",
        "Evitar saltarse comidas",
        "Limitar el consumo de cafeína",
        "Realizar ejercicio moderado regularmente"
    ],
    HOMBRE: [
        "Evitar el consumo excesivo de alcohol",
        "Mantener un peso saludable",
        "Realizar ejercicio regular moderado",
        "Gestionar el estrés laboral",
        "Evitar el tabaquismo"
    ],
    MUJER: [
        "Llevar un registro de síntomas relacionados con el ciclo menstrual",
        "Consultar sobre anticonceptivos hormonales si es relevante",
        "Considerar suplementos de magnesio bajo supervisión médica",
        "Monitorear cambios hormonales",
        "Evaluar factores relacionados con la menopausia si aplica"
    ]
};

/**
 * Recomendaciones específicas por tipo de migraña
 */
export const RECOMENDACIONES_POR_TIPO = {
    [TIPOS_MIGRANA.SIN_AURA]: [
        "Tomar medicación al primer síntoma de dolor",
        "Descansar en un ambiente oscuro y silencioso",
        "Aplicar compresas frías en la cabeza",
        "Evitar ruidos fuertes y luces brillantes"
    ],
    [TIPOS_MIGRANA.CON_AURA]: [
        "Reconocer los síntomas de aura para medicación temprana",
        "Evitar luces brillantes y pantallas durante el aura",
        "Descansar inmediatamente al inicio del aura",
        "Tener medicación de rescate siempre disponible"
    ],
    [TIPOS_MIGRANA.CEFALEA_TENSIONAL]: [
        "Aplicar técnicas de relajación muscular",
        "Considerar fisioterapia para el cuello y hombros",
        "Mejorar la postura corporal",
        "Realizar pausas frecuentes en el trabajo"
    ]
};

/**
 * Umbrales de cumplimiento para toma de decisiones
 */
export const UMBRALES_CUMPLIMIENTO = {
    ALTO: 85,          // >= 85% - Considerar modificar tratamiento
    MEDIO: 60,         // 60-84% - Continuar con seguimiento
    BAJO: 60           // < 60% - Considerar cancelar tratamiento
};

/**
 * Prioridades de alertas
 */
export const PRIORIDADES_ALERTA = {
    ALTA: 'alta',
    MEDIA: 'media',
    BAJA: 'baja'
};

/**
 * Acciones recomendadas basadas en cumplimiento
 */
export const ACCIONES_TRATAMIENTO = {
    MODIFICAR: 'modificar',
    CONTINUAR: 'continuar',
    CANCELAR: 'cancelar',
    PAUSAR: 'pausar'
};

/**
 * Columnas para la tabla de tratamientos
 */
export const COLUMNAS_TRATAMIENTOS = [
    { key: 'id', header: '# Tratamiento', width: '10%' },
    { key: 'episodio', header: 'Episodio', width: '15%' },
    { key: 'fecha_inicio', header: 'Fecha', width: '15%' },
    { key: 'estado_display', header: 'Estado', width: '15%' },
    { key: 'cumplimiento', header: '% Cumplimiento', width: '15%' },
    { key: 'acciones', header: 'Acciones', width: '30%' }
];

/**
 * Columnas para la tabla de medicamentos en tratamiento
 */
export const COLUMNAS_MEDICAMENTOS = [
    { key: 'cantidad', header: 'Cantidad', width: '15%' },
    { key: 'medicamento', header: 'Medicamento', width: '25%' },
    { key: 'caracteristica', header: 'Característica', width: '20%' },
    { key: 'frecuencia', header: 'Frecuencia', width: '15%' },
    { key: 'duracion', header: 'Duración Tratamiento', width: '20%' },
    { key: 'acciones', header: 'Acciones', width: '5%' }
];

/**
 * Columnas para la tabla de historial de tratamientos
 */
export const COLUMNAS_HISTORIAL = [
    { key: 'id', header: '# Tratamiento', width: '15%' },
    { key: 'episodio', header: 'Episodio', width: '15%' },
    { key: 'fecha_inicio', header: 'Fecha', width: '15%' },
    { key: 'estado_display', header: 'Estado', width: '15%' },
    { key: 'cumplimiento', header: '% Cumplimiento', width: '15%' },
    { key: 'acciones', header: 'Acciones', width: '25%' }
];

/**
 * Mensajes de validación
 */
export const MENSAJES_VALIDACION = {
    CAMPO_REQUERIDO: 'Este campo es requerido',
    MEDICAMENTO_NOMBRE_REQUERIDO: 'El nombre del medicamento es requerido',
    MEDICAMENTO_DOSIS_REQUERIDA: 'La dosis del medicamento es requerida',
    FRECUENCIA_INVALIDA: 'La frecuencia debe ser un número válido mayor a 0',
    DURACION_INVALIDA: 'La duración debe ser un número válido mayor a 0',
    FECHA_INVALIDA: 'La fecha no es válida',
    PACIENTE_REQUERIDO: 'Debe seleccionar un paciente',
    AL_MENOS_UN_MEDICAMENTO: 'Debe incluir al menos un medicamento'
};

/**
 * Mensajes de éxito
 */
export const MENSAJES_EXITO = {
    TRATAMIENTO_CREADO: 'Tratamiento creado exitosamente',
    TRATAMIENTO_ACTUALIZADO: 'Tratamiento actualizado exitosamente',
    TRATAMIENTO_SUSPENDIDO: 'Tratamiento suspendido exitosamente',
    MEDICAMENTO_AGREGADO: 'Medicamento agregado al tratamiento',
    MEDICAMENTO_ELIMINADO: 'Medicamento eliminado del tratamiento'
};

/**
 * Mensajes de error
 */
export const MENSAJES_ERROR = {
    ERROR_CREAR_TRATAMIENTO: 'Error al crear el tratamiento',
    ERROR_ACTUALIZAR_TRATAMIENTO: 'Error al actualizar el tratamiento',
    ERROR_SUSPENDER_TRATAMIENTO: 'Error al suspender el tratamiento',
    ERROR_CARGAR_TRATAMIENTOS: 'Error al cargar los tratamientos',
    ERROR_CARGAR_HISTORIAL: 'Error al cargar el historial',
    ERROR_CONEXION: 'Error de conexión con el servidor',
    TOKEN_EXPIRADO: 'La sesión ha expirado, por favor inicie sesión nuevamente'
};

/**
 * Configuración de paginación
 */
export const PAGINACION_CONFIG = {
    ITEMS_POR_PAGINA: 10,
    ITEMS_POR_PAGINA_OPCIONES: [5, 10, 15, 20]
};

/**
 * Configuración de exportación de datos
 */
export const EXPORT_CONFIG = {
    FORMATOS: ['pdf', 'excel', 'csv'],
    NOMBRE_ARCHIVO_BASE: 'tratamientos_paciente'
};

/**
 * Roles de usuario para permisos
 */
export const ROLES_USUARIO = {
    MEDICO: 'medico',
    PACIENTE: 'paciente',
    ADMINISTRADOR: 'administrador'
};

/**
 * Configuración de notificaciones
 */
export const NOTIFICACIONES_CONFIG = {
    DURACION_DEFAULT: 5000, // 5 segundos
    POSICION: 'top-right',
    TIPOS: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    }
};
