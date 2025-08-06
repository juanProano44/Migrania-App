// Utilidades para manejo de fechas en tratamientos

/**
 * Obtiene la fecha actual en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha actual en formato ISO
 */
export const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
};

/**
 * Obtiene la fecha y hora actual en formato ISO completo
 * @returns {string} Fecha y hora actual en formato ISO
 */
export const getCurrentDateTime = () => {
    return new Date().toISOString();
};

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param {string|Date} fecha - Fecha a formatear
 * @param {string} formato - Formato deseado ('short', 'long', 'time')
 * @returns {string} Fecha formateada
 */
export const formatDate = (fecha, formato = 'short') => {
    if (!fecha) return '-';
    
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    
    if (isNaN(date.getTime())) {
        return 'Fecha inválida';
    }
    
    const options = {
        short: { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        },
        long: { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        },
        time: { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        },
        datetime: { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit', 
            minute: '2-digit' 
        }
    };
    
    return date.toLocaleDateString('es-ES', options[formato] || options.short);
};

/**
 * Calcula la fecha de finalización de un tratamiento
 * @param {string|Date} fechaInicio - Fecha de inicio del tratamiento
 * @param {number} duracionDias - Duración del tratamiento en días
 * @returns {Date} Fecha de finalización
 */
export const calculateEndDate = (fechaInicio, duracionDias) => {
    const startDate = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + duracionDias);
    return endDate;
};

/**
 * Calcula los días transcurridos desde el inicio de un tratamiento
 * @param {string|Date} fechaInicio - Fecha de inicio del tratamiento
 * @param {string|Date} fechaActual - Fecha actual (opcional, usa fecha actual por defecto)
 * @returns {number} Días transcurridos
 */
export const calculateDaysElapsed = (fechaInicio, fechaActual = new Date()) => {
    const startDate = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const currentDate = typeof fechaActual === 'string' ? new Date(fechaActual) : fechaActual;
    
    const timeDifference = currentDate.getTime() - startDate.getTime();
    return Math.floor(timeDifference / (1000 * 60 * 60 * 24));
};

/**
 * Calcula los días restantes de un tratamiento
 * @param {string|Date} fechaInicio - Fecha de inicio
 * @param {number} duracionDias - Duración total en días
 * @param {string|Date} fechaActual - Fecha actual (opcional)
 * @returns {number} Días restantes (puede ser negativo si ya terminó)
 */
export const calculateRemainingDays = (fechaInicio, duracionDias, fechaActual = new Date()) => {
    const daysElapsed = calculateDaysElapsed(fechaInicio, fechaActual);
    return duracionDias - daysElapsed;
};

/**
 * Verifica si un tratamiento está activo basado en las fechas
 * @param {string|Date} fechaInicio - Fecha de inicio
 * @param {number} duracionDias - Duración en días
 * @param {string|Date} fechaActual - Fecha actual (opcional)
 * @returns {boolean} True si el tratamiento está activo
 */
export const isTreatmentActive = (fechaInicio, duracionDias, fechaActual = new Date()) => {
    const remainingDays = calculateRemainingDays(fechaInicio, duracionDias, fechaActual);
    return remainingDays >= 0;
};

/**
 * Genera un array de fechas de toma de medicamento
 * @param {string|Date} fechaInicio - Fecha de inicio del tratamiento
 * @param {number} duracionDias - Duración del tratamiento en días
 * @param {number} frecuenciaHoras - Frecuencia de toma en horas
 * @param {string} horaInicio - Hora de inicio (formato HH:MM)
 * @returns {Array} Array de fechas y horas de toma
 */
export const generateMedicationSchedule = (fechaInicio, duracionDias, frecuenciaHoras, horaInicio = '08:00') => {
    const schedule = [];
    const startDate = typeof fechaInicio === 'string' ? new Date(fechaInicio) : new Date(fechaInicio);
    
    // Configurar hora de inicio
    const [hours, minutes] = horaInicio.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = calculateEndDate(startDate, duracionDias);
    const currentDateTime = new Date(startDate);
    
    while (currentDateTime <= endDate) {
        schedule.push(new Date(currentDateTime));
        currentDateTime.setHours(currentDateTime.getHours() + frecuenciaHoras);
    }
    
    return schedule;
};

/**
 * Calcula la próxima dosis de medicamento
 * @param {Array} schedule - Horario de medicación generado
 * @param {string|Date} fechaActual - Fecha actual (opcional)
 * @returns {Date|null} Próxima fecha de toma o null si no hay más
 */
export const getNextDose = (schedule, fechaActual = new Date()) => {
    const currentDate = typeof fechaActual === 'string' ? new Date(fechaActual) : fechaActual;
    
    const nextDose = schedule.find(dose => dose > currentDate);
    return nextDose || null;
};

/**
 * Calcula dosis perdidas de medicamento
 * @param {Array} schedule - Horario de medicación
 * @param {Array} takenDoses - Dosis tomadas (array de fechas)
 * @param {string|Date} fechaActual - Fecha actual (opcional)
 * @returns {Array} Dosis perdidas
 */
export const getMissedDoses = (schedule, takenDoses = [], fechaActual = new Date()) => {
    const currentDate = typeof fechaActual === 'string' ? new Date(fechaActual) : fechaActual;
    const takenDatesSet = new Set(takenDoses.map(date => new Date(date).getTime()));
    
    return schedule.filter(dose => {
        const doseTime = dose.getTime();
        return dose < currentDate && !takenDatesSet.has(doseTime);
    });
};

/**
 * Valida si una fecha es válida
 * @param {string|Date} fecha - Fecha a validar
 * @returns {boolean} True si la fecha es válida
 */
export const isValidDate = (fecha) => {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Convierte una fecha del formato del input de HTML5 (YYYY-MM-DD) a Date
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {Date|null} Objeto Date o null si es inválida
 */
export const parseInputDate = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString + 'T00:00:00');
    return isValidDate(date) ? date : null;
};

/**
 * Convierte una fecha a formato para input HTML5 (YYYY-MM-DD)
 * @param {string|Date} fecha - Fecha a convertir
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const toInputDateFormat = (fecha) => {
    if (!fecha) return '';
    
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    if (!isValidDate(date)) return '';
    
    return date.toISOString().split('T')[0];
};

/**
 * Obtiene el rango de fechas de un tratamiento
 * @param {string|Date} fechaInicio - Fecha de inicio
 * @param {number} duracionDias - Duración en días
 * @returns {Object} Objeto con fechaInicio y fechaFin
 */
export const getTreatmentDateRange = (fechaInicio, duracionDias) => {
    const startDate = typeof fechaInicio === 'string' ? new Date(fechaInicio) : new Date(fechaInicio);
    const endDate = calculateEndDate(startDate, duracionDias);
    
    return {
        fechaInicio: startDate,
        fechaFin: endDate,
        duracionTotal: duracionDias
    };
};

/**
 * Calcula el progreso de un tratamiento como porcentaje
 * @param {string|Date} fechaInicio - Fecha de inicio
 * @param {number} duracionDias - Duración total en días
 * @param {string|Date} fechaActual - Fecha actual (opcional)
 * @returns {number} Progreso como porcentaje (0-100)
 */
export const calculateTreatmentProgress = (fechaInicio, duracionDias, fechaActual = new Date()) => {
    const daysElapsed = calculateDaysElapsed(fechaInicio, fechaActual);
    const progress = Math.min((daysElapsed / duracionDias) * 100, 100);
    return Math.max(progress, 0); // No permitir progreso negativo
};

/**
 * Verifica si una fecha está en el rango de un tratamiento
 * @param {string|Date} fecha - Fecha a verificar
 * @param {string|Date} fechaInicio - Fecha de inicio del tratamiento
 * @param {number} duracionDias - Duración del tratamiento
 * @returns {boolean} True si la fecha está en el rango
 */
export const isDateInTreatmentRange = (fecha, fechaInicio, duracionDias) => {
    const checkDate = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const startDate = typeof fechaInicio === 'string' ? new Date(fechaInicio) : new Date(fechaInicio);
    const endDate = calculateEndDate(startDate, duracionDias);
    
    return checkDate >= startDate && checkDate <= endDate;
};

/**
 * Formatea una duración en días a texto legible
 * @param {number} dias - Número de días
 * @returns {string} Duración formateada
 */
export const formatDuration = (dias) => {
    if (dias === 1) return '1 día';
    if (dias < 7) return `${dias} días`;
    if (dias === 7) return '1 semana';
    if (dias < 30) {
        const semanas = Math.floor(dias / 7);
        const diasRestantes = dias % 7;
        if (diasRestantes === 0) {
            return `${semanas} semana${semanas > 1 ? 's' : ''}`;
        }
        return `${semanas} semana${semanas > 1 ? 's' : ''} y ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}`;
    }
    if (dias === 30) return '1 mes';
    
    const meses = Math.floor(dias / 30);
    const diasRestantes = dias % 30;
    if (diasRestantes === 0) {
        return `${meses} mes${meses > 1 ? 'es' : ''}`;
    }
    return `${meses} mes${meses > 1 ? 'es' : ''} y ${diasRestantes} día${diasRestantes > 1 ? 's' : ''}`;
};

/**
 * Obtiene la zona horaria local
 * @returns {string} Zona horaria local
 */
export const getLocalTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Compara dos fechas de tratamiento (para ordenamiento)
 * @param {Object} tratamientoA - Primer tratamiento
 * @param {Object} tratamientoB - Segundo tratamiento
 * @returns {number} Resultado de la comparación
 */
export const compareTreatmentDates = (tratamientoA, tratamientoB) => {
    const fechaA = new Date(tratamientoA.fecha_inicio || tratamientoA.creado_en || 0);
    const fechaB = new Date(tratamientoB.fecha_inicio || tratamientoB.creado_en || 0);
    
    return fechaB.getTime() - fechaA.getTime(); // Más reciente primero
};
