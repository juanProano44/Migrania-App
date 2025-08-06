// Utilidades para formateo y presentación de datos de tratamiento

import { formatDate, formatDuration } from './dateUtils.js';
import { ESTADOS_TRATAMIENTO, TIPOS_MIGRANA } from './constants.js';

/**
 * Formatea el estado de un tratamiento para mostrar
 * @param {string|boolean} estado - Estado del tratamiento
 * @param {boolean} activo - Si el tratamiento está activo
 * @returns {Object} Objeto con texto, clase CSS y color
 */
export const formatEstadoTratamiento = (estado, activo = true) => {
    let texto, className, color;
    
    if (typeof estado === 'boolean') {
        estado = estado ? ESTADOS_TRATAMIENTO.ACTIVO : ESTADOS_TRATAMIENTO.FINALIZADO;
    }
    
    // Si se proporciona el campo activo, usarlo como referencia principal
    if (activo !== undefined) {
        estado = activo ? ESTADOS_TRATAMIENTO.ACTIVO : ESTADOS_TRATAMIENTO.FINALIZADO;
    }
    
    switch (estado) {
        case ESTADOS_TRATAMIENTO.ACTIVO:
            texto = 'Activo';
            className = 'estado-activo';
            color = '#28a745'; // Verde
            break;
        case ESTADOS_TRATAMIENTO.FINALIZADO:
            texto = 'Finalizado';
            className = 'estado-finalizado';
            color = '#6c757d'; // Gris
            break;
        case ESTADOS_TRATAMIENTO.SUSPENDIDO:
            texto = 'Suspendido';
            className = 'estado-suspendido';
            color = '#dc3545'; // Rojo
            break;
        case ESTADOS_TRATAMIENTO.PAUSADO:
            texto = 'Pausado';
            className = 'estado-pausado';
            color = '#ffc107'; // Amarillo
            break;
        case ESTADOS_TRATAMIENTO.CANCELADO:
            texto = 'Cancelado';
            className = 'estado-cancelado';
            color = '#dc3545'; // Rojo
            break;
        default:
            texto = 'Desconocido';
            className = 'estado-desconocido';
            color = '#6c757d'; // Gris
    }
    
    return { texto, className, color };
};

/**
 * Formatea el porcentaje de cumplimiento con color y estado
 * @param {number|string} cumplimiento - Porcentaje de cumplimiento
 * @returns {Object} Objeto con texto formateado, clase CSS y color
 */
export const formatCumplimiento = (cumplimiento) => {
    const valor = typeof cumplimiento === 'string' ? parseFloat(cumplimiento) : cumplimiento;
    
    if (isNaN(valor)) {
        return {
            texto: 'N/A',
            className: 'cumplimiento-na',
            color: '#6c757d',
            valor: 0
        };
    }
    
    const textoFormateado = `${Math.round(valor)}%`;
    let className, color, estado;
    
    if (valor >= 85) {
        className = 'cumplimiento-alto';
        color = '#28a745'; // Verde
        estado = 'alto';
    } else if (valor >= 60) {
        className = 'cumplimiento-medio';
        color = '#ffc107'; // Amarillo
        estado = 'medio';
    } else {
        className = 'cumplimiento-bajo';
        color = '#dc3545'; // Rojo
        estado = 'bajo';
    }
    
    return {
        texto: textoFormateado,
        className,
        color,
        valor: Math.round(valor),
        estado
    };
};

/**
 * Formatea la información de un medicamento para mostrar
 * @param {Object} medicamento - Objeto medicamento
 * @returns {string} Medicamento formateado como texto
 */
export const formatMedicamento = (medicamento) => {
    if (!medicamento) return 'Sin información';
    
    const nombre = medicamento.nombre || medicamento.medicamento || 'Medicamento';
    const dosis = medicamento.dosis || medicamento.cantidad || '';
    const caracteristica = medicamento.caracteristica || '';
    const frecuencia = formatFrecuencia(medicamento.frecuencia_horas || medicamento.frecuencia);
    const duracion = formatDuration(medicamento.duracion_dias || parseDurationFromString(medicamento.duracion));
    
    let resultado = nombre;
    
    if (dosis && caracteristica) {
        resultado += ` ${dosis} (${caracteristica})`;
    } else if (dosis) {
        resultado += ` ${dosis}`;
    } else if (caracteristica) {
        resultado += ` (${caracteristica})`;
    }
    
    if (frecuencia) {
        resultado += ` - ${frecuencia}`;
    }
    
    if (duracion && medicamento.duracion_dias) {
        resultado += ` por ${duracion}`;
    }
    
    return resultado;
};

/**
 * Formatea la frecuencia de un medicamento
 * @param {number|string} frecuencia - Frecuencia en horas o string
 * @returns {string} Frecuencia formateada
 */
export const formatFrecuencia = (frecuencia) => {
    if (!frecuencia) return '';
    
    // Si ya es un string formateado, devolverlo
    if (typeof frecuencia === 'string' && frecuencia.toLowerCase().includes('cada')) {
        return frecuencia;
    }
    
    // Si es un string como "C/8h", convertirlo
    if (typeof frecuencia === 'string') {
        const match = frecuencia.match(/(\d+)/);
        if (match) {
            frecuencia = parseInt(match[1]);
        } else {
            return frecuencia; // Devolver como está si no se puede parsear
        }
    }
    
    const horas = parseInt(frecuencia);
    if (isNaN(horas)) return '';
    
    if (horas === 24) return 'Una vez al día';
    if (horas === 12) return 'Cada 12 horas';
    if (horas === 8) return 'Cada 8 horas';
    if (horas === 6) return 'Cada 6 horas';
    if (horas === 4) return 'Cada 4 horas';
    
    return `Cada ${horas} hora${horas > 1 ? 's' : ''}`;
};

/**
 * Formatea una lista de medicamentos para mostrar
 * @param {Array} medicamentos - Array de medicamentos
 * @param {number} maxItems - Máximo número de items a mostrar
 * @returns {string} Lista de medicamentos formateada
 */
export const formatListaMedicamentos = (medicamentos, maxItems = 2) => {
    if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
        return 'Sin medicamentos';
    }
    
    const medicamentosFormateados = medicamentos
        .slice(0, maxItems)
        .map(med => formatMedicamento(med));
    
    let resultado = medicamentosFormateados.join(', ');
    
    if (medicamentos.length > maxItems) {
        resultado += ` y ${medicamentos.length - maxItems} más...`;
    }
    
    return resultado;
};

/**
 * Formatea una lista de recomendaciones
 * @param {Array} recomendaciones - Array de recomendaciones
 * @param {string} separator - Separador entre recomendaciones
 * @returns {string} Recomendaciones formateadas
 */
export const formatRecomendaciones = (recomendaciones, separator = ', ') => {
    if (!Array.isArray(recomendaciones) || recomendaciones.length === 0) {
        return 'Sin recomendaciones';
    }
    
    return recomendaciones
        .map(rec => {
            if (typeof rec === 'string') return rec;
            return rec.descripcion || rec.texto || rec.nombre || 'Recomendación';
        })
        .join(separator);
};

/**
 * Formatea el tipo de migraña para mostrar
 * @param {string} tipo - Tipo de migraña
 * @returns {Object} Objeto con texto formateado y clase CSS
 */
export const formatTipoMigrana = (tipo) => {
    let texto, className;
    
    switch (tipo) {
        case TIPOS_MIGRANA.SIN_AURA:
            texto = 'Migraña sin aura';
            className = 'tipo-migrana-sin-aura';
            break;
        case TIPOS_MIGRANA.CON_AURA:
            texto = 'Migraña con aura';
            className = 'tipo-migrana-con-aura';
            break;
        case TIPOS_MIGRANA.CEFALEA_TENSIONAL:
            texto = 'Cefalea tensional';
            className = 'tipo-cefalea-tensional';
            break;
        default:
            texto = tipo || 'No especificado';
            className = 'tipo-no-especificado';
    }
    
    return { texto, className };
};

/**
 * Formatea números con separadores de miles
 * @param {number} numero - Número a formatear
 * @param {number} decimales - Número de decimales
 * @returns {string} Número formateado
 */
export const formatNumber = (numero, decimales = 0) => {
    if (numero === null || numero === undefined || isNaN(numero)) {
        return '0';
    }
    
    return numero.toLocaleString('es-ES', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    });
};

/**
 * Formatea bytes a unidades legibles
 * @param {number} bytes - Número de bytes
 * @param {number} decimales - Decimales a mostrar
 * @returns {string} Tamaño formateado
 */
export const formatFileSize = (bytes, decimales = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimales < 0 ? 0 : decimales;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Formatea un rango de fechas
 * @param {string|Date} fechaInicio - Fecha de inicio
 * @param {string|Date} fechaFin - Fecha de fin
 * @param {string} formato - Formato de fecha
 * @returns {string} Rango de fechas formateado
 */
export const formatDateRange = (fechaInicio, fechaFin, formato = 'short') => {
    const inicio = formatDate(fechaInicio, formato);
    const fin = formatDate(fechaFin, formato);
    
    if (inicio === fin) {
        return inicio;
    }
    
    return `${inicio} - ${fin}`;
};

/**
 * Formatea texto para URL (slug)
 * @param {string} texto - Texto a convertir
 * @returns {string} Texto convertido a slug
 */
export const formatSlug = (texto) => {
    if (!texto) return '';
    
    return texto
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Espacios a guiones
        .replace(/[áàäâã]/g, 'a')       // Acentos a
        .replace(/[éèëê]/g, 'e')        // Acentos e
        .replace(/[íìïî]/g, 'i')        // Acentos i
        .replace(/[óòöôõ]/g, 'o')       // Acentos o
        .replace(/[úùüû]/g, 'u')        // Acentos u
        .replace(/[ñ]/g, 'n')           // Ñ
        .replace(/[ç]/g, 'c')           // Ç
        .replace(/[^a-z0-9-]/g, '')     // Solo letras, números y guiones
        .replace(/-+/g, '-')            // Múltiples guiones a uno
        .replace(/^-|-$/g, '');         // Quitar guiones al inicio y final
};

/**
 * Formatea texto para capitalizar primera letra
 * @param {string} texto - Texto a formatear
 * @returns {string} Texto con primera letra mayúscula
 */
export const capitalize = (texto) => {
    if (!texto || typeof texto !== 'string') return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

/**
 * Formatea texto para título (primera letra de cada palabra en mayúscula)
 * @param {string} texto - Texto a formatear
 * @returns {string} Texto en formato título
 */
export const titleCase = (texto) => {
    if (!texto || typeof texto !== 'string') return '';
    
    return texto
        .toLowerCase()
        .split(' ')
        .map(word => capitalize(word))
        .join(' ');
};

/**
 * Trunca texto a un número máximo de caracteres
 * @param {string} texto - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} suffix - Sufijo para texto truncado
 * @returns {string} Texto truncado
 */
export const truncateText = (texto, maxLength = 50, suffix = '...') => {
    if (!texto || typeof texto !== 'string') return '';
    
    if (texto.length <= maxLength) return texto;
    
    return texto.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Formatea un tratamiento completo para mostrar en tabla
 * @param {Object} tratamiento - Objeto tratamiento
 * @returns {Object} Tratamiento formateado para tabla
 */
export const formatTreatmentForTable = (tratamiento) => {
    if (!tratamiento) return {};
    
    const estadoFormateado = formatEstadoTratamiento(tratamiento.estado, tratamiento.activo);
    const cumplimientoFormateado = formatCumplimiento(tratamiento.cumplimiento);
    
    return {
        ...tratamiento,
        id_display: `#${tratamiento.id || 'N/A'}`,
        fecha_inicio_display: formatDate(tratamiento.fecha_inicio),
        fecha_fin_display: formatDate(tratamiento.fecha_finalizacion),
        estado_display: estadoFormateado.texto,
        estado_class: estadoFormateado.className,
        estado_color: estadoFormateado.color,
        cumplimiento_display: cumplimientoFormateado.texto,
        cumplimiento_class: cumplimientoFormateado.className,
        cumplimiento_color: cumplimientoFormateado.color,
        medicamentos_display: formatListaMedicamentos(tratamiento.medicamentos),
        recomendaciones_display: formatRecomendaciones(tratamiento.recomendaciones),
        episodio_display: tratamiento.episodio?.id ? `#${tratamiento.episodio.id}` : tratamiento.episodio || 'N/A'
    };
};

/**
 * Función auxiliar para parsear duración desde string
 * @param {string} duracionStr - String de duración
 * @returns {number} Duración en días
 */
const parseDurationFromString = (duracionStr) => {
    if (!duracionStr || typeof duracionStr !== 'string') return 0;
    
    const numero = parseInt(duracionStr.match(/(\d+)/)?.[1] || '0');
    const texto = duracionStr.toLowerCase();
    
    if (texto.includes('semana')) return numero * 7;
    if (texto.includes('mes')) return numero * 30;
    return numero; // Asumir días por defecto
};

/**
 * Formatea moneda (para costos de tratamiento si se implementa)
 * @param {number} amount - Cantidad
 * @param {string} currency - Código de moneda
 * @returns {string} Cantidad formateada como moneda
 */
export const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '$0.00';
    }
    
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount);
};

/**
 * Formatea porcentaje
 * @param {number} value - Valor decimal (0.5 = 50%)
 * @param {number} decimales - Número de decimales
 * @returns {string} Porcentaje formateado
 */
export const formatPercentage = (value, decimales = 1) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }
    
    return (value * 100).toFixed(decimales) + '%';
};
