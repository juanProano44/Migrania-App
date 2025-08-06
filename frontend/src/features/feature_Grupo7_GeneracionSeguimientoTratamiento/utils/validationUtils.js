// Utilidades de validación para formularios de tratamiento

import { 
    REQUIRED_FIELDS, 
    REQUIRED_MEDICAMENTO_FIELDS, 
    MENSAJES_VALIDACION,
    UMBRALES_CUMPLIMIENTO
} from './constants.js';
import { isValidDate, parseInputDate } from './dateUtils.js';

/**
 * Valida un campo requerido
 * @param {any} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} Resultado de validación con isValid y mensaje
 */
export const validateRequired = (value, fieldName) => {
    const isEmpty = value === null || value === undefined || value === '' || 
                   (typeof value === 'string' && value.trim() === '');
    
    return {
        isValid: !isEmpty,
        message: isEmpty ? `${fieldName} ${MENSAJES_VALIDACION.CAMPO_REQUERIDO.toLowerCase()}` : ''
    };
};

/**
 * Valida un campo de texto
 * @param {string} value - Valor a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object} Resultado de validación
 */
export const validateText = (value, options = {}) => {
    const {
        required = false,
        minLength = 0,
        maxLength = 255,
        fieldName = 'Campo'
    } = options;
    
    // Validar requerido
    if (required) {
        const requiredValidation = validateRequired(value, fieldName);
        if (!requiredValidation.isValid) {
            return requiredValidation;
        }
    }
    
    // Si no es requerido y está vacío, es válido
    if (!required && (!value || value.trim() === '')) {
        return { isValid: true, message: '' };
    }
    
    const text = value ? value.toString().trim() : '';
    
    // Validar longitud mínima
    if (text.length < minLength) {
        return {
            isValid: false,
            message: `${fieldName} debe tener al menos ${minLength} caracteres`
        };
    }
    
    // Validar longitud máxima
    if (text.length > maxLength) {
        return {
            isValid: false,
            message: `${fieldName} no puede tener más de ${maxLength} caracteres`
        };
    }
    
    return { isValid: true, message: '' };
};

/**
 * Valida un campo numérico
 * @param {string|number} value - Valor a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object} Resultado de validación
 */
export const validateNumber = (value, options = {}) => {
    const {
        required = false,
        min = null,
        max = null,
        integer = false,
        fieldName = 'Campo'
    } = options;
    
    // Validar requerido
    if (required) {
        const requiredValidation = validateRequired(value, fieldName);
        if (!requiredValidation.isValid) {
            return requiredValidation;
        }
    }
    
    // Si no es requerido y está vacío, es válido
    if (!required && (value === null || value === undefined || value === '')) {
        return { isValid: true, message: '' };
    }
    
    const numValue = parseFloat(value);
    
    // Validar que sea un número
    if (isNaN(numValue)) {
        return {
            isValid: false,
            message: `${fieldName} debe ser un número válido`
        };
    }
    
    // Validar que sea entero si se requiere
    if (integer && !Number.isInteger(numValue)) {
        return {
            isValid: false,
            message: `${fieldName} debe ser un número entero`
        };
    }
    
    // Validar valor mínimo
    if (min !== null && numValue < min) {
        return {
            isValid: false,
            message: `${fieldName} debe ser mayor o igual a ${min}`
        };
    }
    
    // Validar valor máximo
    if (max !== null && numValue > max) {
        return {
            isValid: false,
            message: `${fieldName} debe ser menor o igual a ${max}`
        };
    }
    
    return { isValid: true, message: '' };
};

/**
 * Valida una fecha
 * @param {string|Date} value - Valor de fecha a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object} Resultado de validación
 */
export const validateDate = (value, options = {}) => {
    const {
        required = false,
        minDate = null,
        maxDate = null,
        fieldName = 'Fecha'
    } = options;
    
    // Validar requerido
    if (required) {
        const requiredValidation = validateRequired(value, fieldName);
        if (!requiredValidation.isValid) {
            return requiredValidation;
        }
    }
    
    // Si no es requerido y está vacío, es válido
    if (!required && (!value || value === '')) {
        return { isValid: true, message: '' };
    }
    
    // Validar formato de fecha
    const date = typeof value === 'string' ? parseInputDate(value) : value;
    if (!isValidDate(date)) {
        return {
            isValid: false,
            message: MENSAJES_VALIDACION.FECHA_INVALIDA
        };
    }
    
    // Validar fecha mínima
    if (minDate) {
        const minDateObj = typeof minDate === 'string' ? new Date(minDate) : minDate;
        if (date < minDateObj) {
            return {
                isValid: false,
                message: `${fieldName} no puede ser anterior a ${minDateObj.toLocaleDateString()}`
            };
        }
    }
    
    // Validar fecha máxima
    if (maxDate) {
        const maxDateObj = typeof maxDate === 'string' ? new Date(maxDate) : maxDate;
        if (date > maxDateObj) {
            return {
                isValid: false,
                message: `${fieldName} no puede ser posterior a ${maxDateObj.toLocaleDateString()}`
            };
        }
    }
    
    return { isValid: true, message: '' };
};

/**
 * Valida un medicamento individual
 * @param {Object} medicamento - Objeto medicamento a validar
 * @param {number} index - Índice del medicamento (para mensajes de error)
 * @returns {Object} Resultado de validación con errores por campo
 */
export const validateMedicamento = (medicamento, index = 0) => {
    const errores = {};
    let isValid = true;
    
    // Validar nombre/medicamento
    const nombreValidation = validateText(medicamento.nombre || medicamento.medicamento, {
        required: true,
        minLength: 2,
        maxLength: 100,
        fieldName: 'Nombre del medicamento'
    });
    if (!nombreValidation.isValid) {
        errores.nombre = nombreValidation.message;
        isValid = false;
    }
    
    // Validar dosis/cantidad
    const dosisField = medicamento.dosis || medicamento.cantidad;
    const dosisValidation = validateNumber(dosisField, {
        required: true,
        min: 0.1,
        max: 1000,
        fieldName: 'Dosis'
    });
    if (!dosisValidation.isValid) {
        errores.dosis = dosisValidation.message;
        isValid = false;
    }
    
    // Validar característica (opcional pero si existe debe tener contenido)
    if (medicamento.caracteristica) {
        const caracteristicaValidation = validateText(medicamento.caracteristica, {
            required: false,
            minLength: 1,
            maxLength: 50,
            fieldName: 'Característica'
        });
        if (!caracteristicaValidation.isValid) {
            errores.caracteristica = caracteristicaValidation.message;
            isValid = false;
        }
    }
    
    // Validar frecuencia
    const frecuenciaValidation = validateNumber(medicamento.frecuencia_horas || parseFrequencyFromString(medicamento.frecuencia), {
        required: true,
        min: 1,
        max: 168, // Una semana en horas
        integer: true,
        fieldName: 'Frecuencia'
    });
    if (!frecuenciaValidation.isValid) {
        errores.frecuencia = frecuenciaValidation.message;
        isValid = false;
    }
    
    // Validar duración
    const duracionValidation = validateNumber(medicamento.duracion_dias || parseDurationFromString(medicamento.duracion), {
        required: true,
        min: 1,
        max: 365, // Un año máximo
        integer: true,
        fieldName: 'Duración'
    });
    if (!duracionValidation.isValid) {
        errores.duracion = duracionValidation.message;
        isValid = false;
    }
    
    return {
        isValid,
        errores,
        index
    };
};

/**
 * Valida un formulario completo de tratamiento
 * @param {Object} formData - Datos del formulario
 * @returns {Object} Resultado de validación completa
 */
export const validateTratamientoForm = (formData) => {
    const errores = {};
    let isValid = true;
    
    // Validar paciente
    const pacienteValidation = validateRequired(formData.paciente, 'Paciente');
    if (!pacienteValidation.isValid) {
        errores.paciente = pacienteValidation.message;
        isValid = false;
    }
    
    // Validar fecha de inicio
    const fechaValidation = validateDate(formData.fecha_inicio, {
        required: true,
        minDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
        maxDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año adelante
        fieldName: 'Fecha de inicio'
    });
    if (!fechaValidation.isValid) {
        errores.fecha_inicio = fechaValidation.message;
        isValid = false;
    }
    
    // Validar medicamentos
    const medicamentos = formData.medicamentos || formData.tratamientos || [];
    if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
        errores.medicamentos = MENSAJES_VALIDACION.AL_MENOS_UN_MEDICAMENTO;
        isValid = false;
    } else {
        const medicamentosErrores = [];
        medicamentos.forEach((med, index) => {
            const medValidation = validateMedicamento(med, index);
            if (!medValidation.isValid) {
                medicamentosErrores[index] = medValidation.errores;
                isValid = false;
            }
        });
        
        if (medicamentosErrores.length > 0) {
            errores.medicamentos = medicamentosErrores;
        }
    }
    
    // Validar recomendaciones (opcional)
    if (formData.recomendaciones && Array.isArray(formData.recomendaciones)) {
        formData.recomendaciones.forEach((rec, index) => {
            if (typeof rec === 'string' && rec.trim().length === 0) {
                if (!errores.recomendaciones) errores.recomendaciones = [];
                errores.recomendaciones[index] = 'La recomendación no puede estar vacía';
                isValid = false;
            }
        });
    }
    
    return {
        isValid,
        errores
    };
};

/**
 * Valida datos para suspender un tratamiento
 * @param {Object} data - Datos de suspensión
 * @returns {Object} Resultado de validación
 */
export const validateSuspenderTratamiento = (data) => {
    const errores = {};
    let isValid = true;
    
    // Validar motivo de cancelación
    const motivoValidation = validateText(data.motivo_cancelacion, {
        required: true,
        minLength: 10,
        maxLength: 500,
        fieldName: 'Motivo de cancelación'
    });
    if (!motivoValidation.isValid) {
        errores.motivo_cancelacion = motivoValidation.message;
        isValid = false;
    }
    
    // Validar tratamiento ID
    const tratamientoValidation = validateRequired(data.tratamiento_id, 'ID del tratamiento');
    if (!tratamientoValidation.isValid) {
        errores.tratamiento_id = tratamientoValidation.message;
        isValid = false;
    }
    
    return {
        isValid,
        errores
    };
};

/**
 * Valida el cumplimiento de un tratamiento
 * @param {number} cumplimiento - Porcentaje de cumplimiento
 * @returns {Object} Validación y clasificación del cumplimiento
 */
export const validateCumplimiento = (cumplimiento) => {
    const cumplimientoValidation = validateNumber(cumplimiento, {
        required: true,
        min: 0,
        max: 100,
        fieldName: 'Cumplimiento'
    });
    
    if (!cumplimientoValidation.isValid) {
        return {
            isValid: false,
            message: cumplimientoValidation.message,
            clasificacion: 'invalido'
        };
    }
    
    let clasificacion = 'medio';
    let mensaje = 'Cumplimiento moderado';
    
    if (cumplimiento >= UMBRALES_CUMPLIMIENTO.ALTO) {
        clasificacion = 'alto';
        mensaje = 'Excelente cumplimiento';
    } else if (cumplimiento < UMBRALES_CUMPLIMIENTO.BAJO) {
        clasificacion = 'bajo';
        mensaje = 'Cumplimiento bajo - requiere atención';
    }
    
    return {
        isValid: true,
        message: mensaje,
        clasificacion,
        valor: cumplimiento
    };
};

/**
 * Extrae la frecuencia en horas desde un string descriptivo
 * @param {string} frecuenciaStr - String de frecuencia (ej: "C/8h", "cada 8 horas")
 * @returns {number} Frecuencia en horas
 */
export const parseFrequencyFromString = (frecuenciaStr) => {
    if (!frecuenciaStr || typeof frecuenciaStr !== 'string') return 8;
    
    const match = frecuenciaStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 8;
};

/**
 * Extrae la duración en días desde un string descriptivo
 * @param {string} duracionStr - String de duración (ej: "3 días", "1 semana")
 * @returns {number} Duración en días
 */
export const parseDurationFromString = (duracionStr) => {
    if (!duracionStr || typeof duracionStr !== 'string') return 7;
    
    const numero = parseInt(duracionStr.match(/(\d+)/)?.[1] || '7');
    const texto = duracionStr.toLowerCase();
    
    if (texto.includes('semana')) return numero * 7;
    if (texto.includes('mes')) return numero * 30;
    return numero; // Asumir días por defecto
};

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @param {boolean} required - Si es requerido
 * @returns {Object} Resultado de validación
 */
export const validateEmail = (email, required = false) => {
    if (required) {
        const requiredValidation = validateRequired(email, 'Email');
        if (!requiredValidation.isValid) {
            return requiredValidation;
        }
    }
    
    if (!required && (!email || email.trim() === '')) {
        return { isValid: true, message: '' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    
    return {
        isValid: isValidEmail,
        message: isValidEmail ? '' : 'El formato del email no es válido'
    };
};

/**
 * Valida una hora en formato HH:MM
 * @param {string} time - Hora a validar
 * @param {boolean} required - Si es requerido
 * @returns {Object} Resultado de validación
 */
export const validateTime = (time, required = false) => {
    if (required) {
        const requiredValidation = validateRequired(time, 'Hora');
        if (!requiredValidation.isValid) {
            return requiredValidation;
        }
    }
    
    if (!required && (!time || time.trim() === '')) {
        return { isValid: true, message: '' };
    }
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const isValidTime = timeRegex.test(time);
    
    return {
        isValid: isValidTime,
        message: isValidTime ? '' : 'El formato de hora debe ser HH:MM (24 horas)'
    };
};

/**
 * Valida múltiples campos a la vez
 * @param {Object} data - Datos a validar
 * @param {Object} validationRules - Reglas de validación por campo
 * @returns {Object} Resultado de validación múltiple
 */
export const validateMultipleFields = (data, validationRules) => {
    const errores = {};
    let isValid = true;
    
    Object.keys(validationRules).forEach(fieldName => {
        const rules = validationRules[fieldName];
        const value = data[fieldName];
        
        let fieldValidation = { isValid: true, message: '' };
        
        switch (rules.type) {
            case 'text':
                fieldValidation = validateText(value, { ...rules, fieldName });
                break;
            case 'number':
                fieldValidation = validateNumber(value, { ...rules, fieldName });
                break;
            case 'date':
                fieldValidation = validateDate(value, { ...rules, fieldName });
                break;
            case 'email':
                fieldValidation = validateEmail(value, rules.required);
                break;
            case 'time':
                fieldValidation = validateTime(value, rules.required);
                break;
            default:
                if (rules.required) {
                    fieldValidation = validateRequired(value, fieldName);
                }
        }
        
        if (!fieldValidation.isValid) {
            errores[fieldName] = fieldValidation.message;
            isValid = false;
        }
    });
    
    return {
        isValid,
        errores
    };
};
