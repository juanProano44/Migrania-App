// Exportaciones centralizadas de utilidades para la feature de tratamiento

// API Utils
export {
    getApiUrl,
    isTokenExpired,
    getAuthHeaders,
    createTratamiento,
    getTratamientosByPaciente,
    getTratamientoById,
    updateTratamiento,
    suspenderTratamiento,
    getCumplimientoTratamiento,
    getHistorialTratamientos,
    createMedicamento,
    getAlertas,
    handleApiResponse,
    parseApiResponse
} from './apiUtils.js';

// Treatment Utils
export {
    transformTratamiento,
    getEstadoDisplay,
    transformMedicamentos,
    transformRecomendaciones,
    validateTratamientoData,
    transformFormDataForAPI,
    parseFrequency,
    parseDuration,
    calculateCumplimiento,
    evaluateTreatmentAction,
    generateRecommendations,
    filterTratamientosByEstado,
    sortTratamientosByDate,
    getTratamientoStats
} from './tratamientoUtils.js';

// Date Utils
export {
    getCurrentDate,
    getCurrentDateTime,
    formatDate,
    calculateEndDate,
    calculateDaysElapsed,
    calculateRemainingDays,
    isTreatmentActive,
    generateMedicationSchedule,
    getNextDose,
    getMissedDoses,
    isValidDate,
    parseInputDate,
    toInputDateFormat,
    getTreatmentDateRange,
    calculateTreatmentProgress,
    isDateInTreatmentRange,
    formatDuration,
    getLocalTimezone,
    compareTreatmentDates
} from './dateUtils.js';

// Validation Utils
export {
    validateRequired,
    validateText,
    validateNumber,
    validateDate,
    validateMedicamento,
    validateTratamientoForm,
    validateSuspenderTratamiento,
    validateCumplimiento,
    parseFrequencyFromString,
    parseDurationFromString,
    validateEmail,
    validateTime,
    validateMultipleFields
} from './validationUtils.js';

// Format Utils
export {
    formatEstadoTratamiento,
    formatCumplimiento,
    formatMedicamento,
    formatFrecuencia,
    formatListaMedicamentos,
    formatRecomendaciones,
    formatTipoMigrana,
    formatNumber,
    formatFileSize,
    formatDateRange,
    formatSlug,
    capitalize,
    titleCase,
    truncateText,
    formatTreatmentForTable,
    formatCurrency,
    formatPercentage
} from './formatUtils.js';

// Constants
export {
    ESTADOS_TRATAMIENTO,
    ESTADOS_NOTIFICACION,
    TIPOS_MIGRANA,
    BOOLEAN_FIELDS,
    REQUIRED_FIELDS,
    REQUIRED_MEDICAMENTO_FIELDS,
    FRECUENCIAS_MEDICAMENTOS,
    DURACIONES_TRATAMIENTO,
    MEDICAMENTOS_COMUNES,
    RECOMENDACIONES_BASE,
    RECOMENDACIONES_POR_TIPO,
    UMBRALES_CUMPLIMIENTO,
    PRIORIDADES_ALERTA,
    ACCIONES_TRATAMIENTO,
    COLUMNAS_TRATAMIENTOS,
    COLUMNAS_MEDICAMENTOS,
    COLUMNAS_HISTORIAL,
    MENSAJES_VALIDACION,
    MENSAJES_EXITO,
    MENSAJES_ERROR,
    PAGINACION_CONFIG,
    EXPORT_CONFIG,
    ROLES_USUARIO,
    NOTIFICACIONES_CONFIG
} from './constants.js';

// Importar funciones específicas para usar en helpers
import { getCurrentDate } from './dateUtils.js';
import { 
    validateTratamientoForm, 
    transformFormDataForAPI,
    filterTratamientosByEstado,
    sortTratamientosByDate,
    getTratamientoStats,
    generateRecommendations
} from './tratamientoUtils.js';
import { formatTreatmentForTable } from './formatUtils.js';
import { 
    COLUMNAS_TRATAMIENTOS,
    COLUMNAS_MEDICAMENTOS,
    COLUMNAS_HISTORIAL,
    FRECUENCIAS_MEDICAMENTOS,
    DURACIONES_TRATAMIENTO,
    MEDICAMENTOS_COMUNES
} from './constants.js';

// Funciones de utilidad combinadas y helpers adicionales

/**
 * Inicializa un tratamiento vacío con valores por defecto
 * @param {string} pacienteId - ID del paciente
 * @returns {Object} Objeto tratamiento inicializado
 */
export const initializeEmptyTreatment = (pacienteId = null) => {
    return {
        paciente: pacienteId,
        fecha_inicio: getCurrentDate(),
        activo: true,
        medicamentos: [{
            cantidad: 1,
            medicamento: '',
            caracteristica: '',
            frecuencia: '',
            duracion: ''
        }],
        recomendaciones: []
    };
};

/**
 * Crea un objeto de medicamento vacío
 * @returns {Object} Medicamento vacío con valores por defecto
 */
export const createEmptyMedicamento = () => {
    return {
        cantidad: 1,
        medicamento: '',
        caracteristica: '',
        frecuencia: '',
        duracion: ''
    };
};

/**
 * Valida y procesa un formulario completo de tratamiento
 * @param {Object} formData - Datos del formulario
 * @param {Object} userInfo - Información del usuario
 * @returns {Object} Resultado con datos procesados y validación
 */
export const processFormData = (formData, userInfo) => {
    // Validar datos
    const validation = validateTratamientoForm(formData);
    
    if (!validation.isValid) {
        return {
            success: false,
            errors: validation.errores,
            data: null
        };
    }
    
    // Transformar datos para API
    const processedData = transformFormDataForAPI(formData, userInfo);
    
    return {
        success: true,
        errors: {},
        data: processedData
    };
};

/**
 * Procesa una lista de tratamientos para mostrar en tabla
 * @param {Array} tratamientos - Lista de tratamientos
 * @param {Object} options - Opciones de procesamiento
 * @returns {Array} Tratamientos procesados
 */
export const processTreatmentList = (tratamientos, options = {}) => {
    const {
        sortBy = 'fecha_inicio',
        sortOrder = 'desc',
        filterBy = null,
        formatForTable = true
    } = options;
    
    let processedList = Array.isArray(tratamientos) ? [...tratamientos] : [];
    
    // Filtrar si se especifica
    if (filterBy) {
        if (typeof filterBy === 'string') {
            processedList = filterTratamientosByEstado(processedList, filterBy);
        } else if (typeof filterBy === 'function') {
            processedList = processedList.filter(filterBy);
        }
    }
    
    // Ordenar
    if (sortBy === 'fecha_inicio') {
        processedList = sortTratamientosByDate(processedList);
        if (sortOrder === 'asc') {
            processedList.reverse();
        }
    } else {
        processedList.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }
    
    // Formatear para tabla si se solicita
    if (formatForTable) {
        processedList = processedList.map(tratamiento => formatTreatmentForTable(tratamiento));
    }
    
    return processedList;
};

/**
 * Maneja respuestas de API con manejo de errores estándar
 * @param {Promise} apiCall - Llamada a la API
 * @returns {Promise} Promesa con resultado estándar
 */
export const handleApiCall = async (apiCall) => {
    try {
        const response = await apiCall;
        return {
            success: true,
            data: response,
            error: null
        };
    } catch (error) {
        console.error('Error en llamada API:', error);
        
        let errorMessage = 'Error desconocido';
        if (error.message) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        return {
            success: false,
            data: null,
            error: errorMessage
        };
    }
};

/**
 * Obtiene configuración de columnas para diferentes vistas
 * @param {string} view - Tipo de vista ('tratamientos', 'medicamentos', 'historial')
 * @returns {Array} Configuración de columnas
 */
export const getColumnConfig = (view) => {
    switch (view) {
        case 'tratamientos':
            return COLUMNAS_TRATAMIENTOS;
        case 'medicamentos':
            return COLUMNAS_MEDICAMENTOS;
        case 'historial':
            return COLUMNAS_HISTORIAL;
        default:
            return COLUMNAS_TRATAMIENTOS;
    }
};

/**
 * Genera opciones para select de frecuencias
 * @returns {Array} Opciones de frecuencia formateadas
 */
export const getFrecuenciaOptions = () => {
    return FRECUENCIAS_MEDICAMENTOS.map(freq => ({
        value: freq.value,
        label: freq.label,
        display: freq.display
    }));
};

/**
 * Genera opciones para select de duraciones
 * @returns {Array} Opciones de duración formateadas
 */
export const getDuracionOptions = () => {
    return DURACIONES_TRATAMIENTO.map(dur => ({
        value: dur.value,
        label: dur.label
    }));
};

/**
 * Obtiene medicamentos sugeridos por tipo
 * @param {string} tipo - Tipo de medicamento ('analgesicos', 'triptanos', 'preventivos')
 * @returns {Array} Lista de medicamentos
 */
export const getMedicamentosSugeridos = (tipo) => {
    const tipoUpper = tipo.toUpperCase();
    return MEDICAMENTOS_COMUNES[tipoUpper] || [];
};

/**
 * Obtiene recomendaciones por género y tipo de migraña
 * @param {string} genero - Género del paciente ('M', 'F')
 * @param {string} tipoMigrana - Tipo de migraña
 * @returns {Array} Lista de recomendaciones
 */
export const getRecomendacionesByGeneroAndTipo = (genero, tipoMigrana) => {
    return generateRecommendations(genero, tipoMigrana);
};

/**
 * Calcula estadísticas resumidas de una lista de tratamientos
 * @param {Array} tratamientos - Lista de tratamientos
 * @returns {Object} Estadísticas calculadas
 */
export const calculateTreatmentStatistics = (tratamientos) => {
    const stats = getTratamientoStats(tratamientos);
    
    return {
        ...stats,
        tasaExito: stats.total > 0 ? Math.round((stats.finalizados / stats.total) * 100) : 0,
        tasaAdhesion: stats.cumplimientoPromedio,
        tiempoPromedioTratamiento: calculateAverageTreatmentDuration(tratamientos)
    };
};

/**
 * Calcula la duración promedio de tratamientos finalizados
 * @param {Array} tratamientos - Lista de tratamientos
 * @returns {number} Duración promedio en días
 */
const calculateAverageTreatmentDuration = (tratamientos) => {
    const finalizados = tratamientos.filter(t => !t.activo && t.fecha_inicio && t.fecha_finalizacion);
    
    if (finalizados.length === 0) return 0;
    
    const duraciones = finalizados.map(t => {
        const inicio = new Date(t.fecha_inicio);
        const fin = new Date(t.fecha_finalizacion);
        return Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    });
    
    return Math.round(duraciones.reduce((sum, dur) => sum + dur, 0) / duraciones.length);
};
