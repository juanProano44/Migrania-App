// Utilidades para el manejo de tratamientos - Transformación de datos y lógica de negocio

import { BOOLEAN_FIELDS, REQUIRED_FIELDS, ESTADOS_TRATAMIENTO } from './constants.js';

/**
 * Transforma los datos de un tratamiento para mostrar en la interfaz
 * @param {Object} tratamiento - Objeto tratamiento desde la API
 * @returns {Object} Tratamiento transformado para la UI
 */
export const transformTratamiento = (tratamiento) => ({
    ...tratamiento,
    fecha_inicio: tratamiento.fecha_inicio ? new Date(tratamiento.fecha_inicio).toLocaleDateString() : '-',
    fecha_finalizacion: tratamiento.fecha_finalizacion ? new Date(tratamiento.fecha_finalizacion).toLocaleDateString() : '-',
    activo: tratamiento.activo ? 'Activo' : 'Inactivo',
    cumplimiento: tratamiento.cumplimiento ? `${tratamiento.cumplimiento}%` : '0%',
    estado_display: getEstadoDisplay(tratamiento.estado || tratamiento.activo),
    medicamentos_display: transformMedicamentos(tratamiento.medicamentos || []),
    recomendaciones_display: transformRecomendaciones(tratamiento.recomendaciones || [])
});

/**
 * Obtiene el texto de visualización para el estado del tratamiento
 * @param {string|boolean} estado - Estado del tratamiento
 * @returns {string} Texto del estado para mostrar
 */
export const getEstadoDisplay = (estado) => {
    if (typeof estado === 'boolean') {
        return estado ? 'Activo' : 'Finalizado';
    }
    
    const estadosMap = {
        'activo': 'Activo',
        'finalizado': 'Finalizado',
        'suspendido': 'Suspendido',
        'pausado': 'Pausado'
    };
    
    return estadosMap[estado] || 'Desconocido';
};

/**
 * Transforma la lista de medicamentos para mostrar en formato legible
 * @param {Array} medicamentos - Array de medicamentos
 * @returns {string} Medicamentos en formato de texto
 */
export const transformMedicamentos = (medicamentos) => {
    if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
        return 'Sin medicamentos';
    }
    
    return medicamentos.map(med => {
        const nombre = med.nombre || med.medicamento || 'Medicamento';
        const dosis = med.dosis || med.caracteristica || '';
        const frecuencia = med.frecuencia_horas ? `cada ${med.frecuencia_horas}h` : med.frecuencia || '';
        
        return `${nombre} ${dosis} ${frecuencia}`.trim();
    }).join(', ');
};

/**
 * Transforma la lista de recomendaciones para mostrar
 * @param {Array} recomendaciones - Array de recomendaciones
 * @returns {Array} Recomendaciones procesadas
 */
export const transformRecomendaciones = (recomendaciones) => {
    if (!Array.isArray(recomendaciones)) {
        return [];
    }
    
    return recomendaciones.map(rec => {
        if (typeof rec === 'string') {
            return rec;
        }
        return rec.descripcion || rec.texto || rec.nombre || 'Recomendación';
    });
};

/**
 * Valida los datos de un tratamiento antes de enviar
 * @param {Object} tratamientoData - Datos del tratamiento
 * @returns {Object} Objeto con isValid y errores
 */
export const validateTratamientoData = (tratamientoData) => {
    const errores = [];
    
    // Validar campos requeridos
    REQUIRED_FIELDS.forEach(field => {
        if (!tratamientoData[field] || tratamientoData[field].toString().trim() === '') {
            errores.push(`El campo ${field} es requerido`);
        }
    });
    
    // Validar medicamentos
    if (!tratamientoData.medicamentos || !Array.isArray(tratamientoData.medicamentos) || tratamientoData.medicamentos.length === 0) {
        errores.push('Debe incluir al menos un medicamento');
    } else {
        tratamientoData.medicamentos.forEach((med, index) => {
            if (!med.nombre || !med.nombre.trim()) {
                errores.push(`El medicamento ${index + 1} debe tener un nombre`);
            }
            if (!med.dosis || !med.dosis.toString().trim()) {
                errores.push(`El medicamento ${index + 1} debe tener una dosis`);
            }
            if (!med.frecuencia_horas || med.frecuencia_horas <= 0) {
                errores.push(`El medicamento ${index + 1} debe tener una frecuencia válida`);
            }
        });
    }
    
    // Validar fechas
    if (tratamientoData.fecha_inicio) {
        const fecha = new Date(tratamientoData.fecha_inicio);
        if (isNaN(fecha.getTime())) {
            errores.push('La fecha de inicio no es válida');
        }
    }
    
    return {
        isValid: errores.length === 0,
        errores
    };
};

/**
 * Transforma los datos del formulario para enviar a la API
 * @param {Object} formData - Datos del formulario
 * @param {Object} userInfo - Información del usuario/médico
 * @returns {Object} Datos transformados para la API
 */
export const transformFormDataForAPI = (formData, userInfo) => {
    const transformedData = { ...formData };
    
    // Transformar medicamentos
    if (transformedData.tratamientos && Array.isArray(transformedData.tratamientos)) {
        transformedData.medicamentos = transformedData.tratamientos.map(item => ({
            nombre: item.medicamento,
            dosis: parseInt(item.cantidad) || 1,
            caracteristica: item.caracteristica,
            frecuencia_horas: parseFrequency(item.frecuencia),
            duracion_dias: parseDuration(item.duracion),
            hora_de_inicio: new Date().toTimeString().split(' ')[0] // Hora actual por defecto
        }));
        delete transformedData.tratamientos;
    }
    
    // Agregar información del médico
    if (userInfo?.medico_id) {
        transformedData.medico = userInfo.medico_id;
    }
    
    // Agregar fecha de inicio si no existe
    if (!transformedData.fecha_inicio) {
        transformedData.fecha_inicio = new Date().toISOString().split('T')[0];
    }
    
    // Asegurar que está activo por defecto
    if (transformedData.activo === undefined) {
        transformedData.activo = true;
    }
    
    return transformedData;
};

/**
 * Parsea la frecuencia del formato texto a horas
 * @param {string} frecuencia - Frecuencia en formato texto (ej: "C/8h", "cada 8 horas")
 * @returns {number} Frecuencia en horas
 */
export const parseFrequency = (frecuencia) => {
    if (!frecuencia) return 8; // Default 8 horas
    
    // Buscar números en la cadena
    const match = frecuencia.match(/(\d+)/);
    if (match) {
        return parseInt(match[1]);
    }
    
    // Mapeo de frecuencias comunes
    const frequencyMap = {
        'c/4h': 4,
        'c/6h': 6,
        'c/8h': 8,
        'c/12h': 12,
        'c/24h': 24,
        'cada 4 horas': 4,
        'cada 6 horas': 6,
        'cada 8 horas': 8,
        'cada 12 horas': 12,
        'diario': 24,
        'una vez al día': 24
    };
    
    return frequencyMap[frecuencia.toLowerCase()] || 8;
};

/**
 * Parsea la duración del formato texto a días
 * @param {string} duracion - Duración en formato texto (ej: "3 días", "1 semana")
 * @returns {number} Duración en días
 */
export const parseDuration = (duracion) => {
    if (!duracion) return 7; // Default 7 días
    
    // Buscar números en la cadena
    const match = duracion.match(/(\d+)/);
    if (!match) return 7;
    
    const numero = parseInt(match[1]);
    const texto = duracion.toLowerCase();
    
    if (texto.includes('semana')) {
        return numero * 7;
    } else if (texto.includes('mes')) {
        return numero * 30;
    } else if (texto.includes('día')) {
        return numero;
    }
    
    return numero; // Asumir días si no se especifica
};

/**
 * Calcula el porcentaje de cumplimiento basado en alertas
 * @param {Array} alertas - Array de alertas del tratamiento
 * @returns {number} Porcentaje de cumplimiento (0-100)
 */
export const calculateCumplimiento = (alertas) => {
    if (!Array.isArray(alertas) || alertas.length === 0) {
        return 0;
    }
    
    const alertasCompletadas = alertas.filter(alerta => 
        alerta.estado === 'confirmado_tomado' || alerta.estado === 'tomado'
    ).length;
    
    return Math.round((alertasCompletadas / alertas.length) * 100);
};

/**
 * Determina si un tratamiento necesita ser modificado basado en el cumplimiento
 * @param {number} cumplimiento - Porcentaje de cumplimiento
 * @param {number} diasTranscurridos - Días desde el inicio del tratamiento
 * @returns {Object} Recomendación de acción
 */
export const evaluateTreatmentAction = (cumplimiento, diasTranscurridos) => {
    // Considerar días transcurridos para casos límite
    const factorTiempo = diasTranscurridos > 7 ? 1.1 : 1.0;
    const cumplimientoAjustado = cumplimiento * factorTiempo;
    
    if (cumplimientoAjustado >= 85) {
        return {
            action: 'modificar',
            reason: 'Alto cumplimiento',
            priority: 'baja'
        };
    } else if (cumplimientoAjustado < 60) {
        return {
            action: 'cancelar',
            reason: 'Bajo cumplimiento',
            priority: 'alta'
        };
    } else {
        return {
            action: 'continuar',
            reason: 'Cumplimiento moderado',
            priority: 'media'
        };
    }
};

/**
 * Genera recomendaciones personalizadas basadas en el género y tipo de migraña
 * @param {string} genero - Género del paciente ('M' o 'F')
 * @param {string} tipoMigrana - Tipo de migraña diagnosticada
 * @returns {Array} Array de recomendaciones
 */
export const generateRecommendations = (genero, tipoMigrana) => {
    const baseRecommendations = [
        "Mantener una rutina regular de sueño",
        "Evitar factores desencadenantes conocidos",
        "Mantener una hidratación adecuada",
        "Practicar técnicas de relajación y manejo del estrés"
    ];
    
    const genderSpecificRecommendations = {
        'F': [
            "Llevar un registro de síntomas relacionados con el ciclo menstrual",
            "Consultar sobre anticonceptivos hormonales si es relevante",
            "Considerar suplementos de magnesio bajo supervisión médica"
        ],
        'M': [
            "Evitar el consumo excesivo de alcohol",
            "Mantener un peso saludable",
            "Realizar ejercicio regular moderado"
        ]
    };
    
    const migraineSpecificRecommendations = {
        'Migraña sin aura': [
            "Tomar medicación al primer síntoma de dolor",
            "Descansar en un ambiente oscuro y silencioso"
        ],
        'Migraña con aura': [
            "Reconocer los síntomas de aura para medicación temprana",
            "Evitar luces brillantes y pantallas durante el aura"
        ],
        'Cefalea de tipo tensional': [
            "Aplicar técnicas de relajación muscular",
            "Considerar fisioterapia para el cuello y hombros"
        ]
    };
    
    return [
        ...baseRecommendations,
        ...(genderSpecificRecommendations[genero] || []),
        ...(migraineSpecificRecommendations[tipoMigrana] || [])
    ];
};

/**
 * Filtra tratamientos por estado
 * @param {Array} tratamientos - Array de tratamientos
 * @param {string} estado - Estado a filtrar ('activo', 'finalizado', etc.)
 * @returns {Array} Tratamientos filtrados
 */
export const filterTratamientosByEstado = (tratamientos, estado) => {
    if (!Array.isArray(tratamientos)) return [];
    
    return tratamientos.filter(tratamiento => {
        if (estado === 'activo') {
            return tratamiento.activo === true || tratamiento.estado === 'activo';
        } else if (estado === 'finalizado') {
            return tratamiento.activo === false || tratamiento.estado === 'finalizado';
        }
        return tratamiento.estado === estado;
    });
};

/**
 * Ordena tratamientos por fecha (más reciente primero)
 * @param {Array} tratamientos - Array de tratamientos
 * @returns {Array} Tratamientos ordenados
 */
export const sortTratamientosByDate = (tratamientos) => {
    if (!Array.isArray(tratamientos)) return [];
    
    return [...tratamientos].sort((a, b) => {
        const fechaA = new Date(a.fecha_inicio || a.creado_en || 0);
        const fechaB = new Date(b.fecha_inicio || b.creado_en || 0);
        return fechaB.getTime() - fechaA.getTime();
    });
};

/**
 * Obtiene estadísticas resumidas de tratamientos
 * @param {Array} tratamientos - Array de tratamientos
 * @returns {Object} Estadísticas de tratamientos
 */
export const getTratamientoStats = (tratamientos) => {
    if (!Array.isArray(tratamientos)) {
        return {
            total: 0,
            activos: 0,
            finalizados: 0,
            cumplimientoPromedio: 0
        };
    }
    
    const activos = tratamientos.filter(t => t.activo === true).length;
    const finalizados = tratamientos.filter(t => t.activo === false).length;
    const cumplimientos = tratamientos
        .filter(t => t.cumplimiento && !isNaN(parseFloat(t.cumplimiento)))
        .map(t => parseFloat(t.cumplimiento));
    
    const cumplimientoPromedio = cumplimientos.length > 0 
        ? cumplimientos.reduce((sum, c) => sum + c, 0) / cumplimientos.length 
        : 0;
    
    return {
        total: tratamientos.length,
        activos,
        finalizados,
        cumplimientoPromedio: Math.round(cumplimientoPromedio)
    };
};
