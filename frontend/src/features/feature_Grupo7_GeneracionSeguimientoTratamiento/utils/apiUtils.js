// Utilidades para API de Tratamientos - Generación y Seguimiento

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const TRATAMIENTOS_ENDPOINT = '/tratamientos/';
const MEDICAMENTOS_ENDPOINT = '/medicamentos/';
const RECORDATORIOS_ENDPOINT = '/recordatorios/';
const ALERTAS_ENDPOINT = '/alertas/';

// Tokens temporales - en producción estos vendrían del contexto de autenticación
const TEMP_TOKEN_PACIENTE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU0MjUwODg2LCJpYXQiOjE3NTQyNDcyODYsImp0aSI6IjIzOGE2OTc5Y2EzZTRiMzE5MzI4ZTEyMDQ4ZWRmMTRkIiwidXNlcl9pZCI6IjU4In0.EQafLInInPtkzjXy9Tw0tKSVoZkJ2WcqzWnzQZvC1EA";
const TEMP_TOKEN_MEDICO = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU0MjUwOTcwLCJpYXQiOjE3NTQyNDczNzAsImp0aSI6ImRkNGM2MzkzZDY1ZjQwMTFhZDhjM2EyODAzOTE2NTYyIiwidXNlcl9pZCI6IjEifQ.uy39PM_JfpB0WAuPAc_pvTbjvKCzORkHSV6uD3nafqk";

/**
 * Construye la URL completa para un endpoint
 * @param {string} endpoint - El endpoint a usar
 * @returns {string} URL completa
 */
export const getApiUrl = (endpoint) => {
    return `${BASE_URL}${endpoint}`;
};

/**
 * Verifica si un token JWT ha expirado
 * @param {string} token - Token JWT
 * @returns {boolean} True si el token ha expirado
 */
export const isTokenExpired = (token) => {
    if (!token) return true;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime;
    } catch (error) {
        console.error('Error al verificar token:', error);
        return true;
    }
};

/**
 * Obtiene los headers de autenticación para las peticiones API
 * @param {string} token - Token de autenticación opcional
 * @param {string} userType - Tipo de usuario (medico, paciente)
 * @returns {Object} Headers para la petición
 */
export const getAuthHeaders = (token = null, userType = 'medico') => {
    const defaultToken = token || (userType === 'medico' ? TEMP_TOKEN_MEDICO : TEMP_TOKEN_PACIENTE);

    if (isTokenExpired(defaultToken)) {
        console.warn(`Token ${userType} ha expirado`);
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': defaultToken ? `Bearer ${defaultToken}` : '',
    };
};

/**
 * Crea un nuevo tratamiento
 * @param {Object} tratamientoData - Datos del tratamiento
 * @param {string} token - Token de autenticación
 * @returns {Promise} Promesa con la respuesta de la API
 */
export const createTratamiento = async (tratamientoData, token = null) => {
    try {
        const response = await fetch(getApiUrl(TRATAMIENTOS_ENDPOINT), {
            method: 'POST',
            headers: getAuthHeaders(token, 'medico'),
            body: JSON.stringify(tratamientoData)
        });

        if (!response.ok) {
            throw new Error(`Error al crear tratamiento: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creando tratamiento:', error);
        throw error;
    }
};

/**
 * Obtiene los tratamientos de un paciente
 * @param {string} pacienteId - ID del paciente
 * @param {string} token - Token de autenticación
 * @returns {Promise} Promesa con la lista de tratamientos
 */
export const getTratamientosByPaciente = async (pacienteId, token = null) => {
    try {
        const response = await fetch(getApiUrl(`${TRATAMIENTOS_ENDPOINT}paciente/${pacienteId}/`), {
            method: 'GET',
            headers: getAuthHeaders(token, 'medico')
        });

        if (!response.ok) {
            throw new Error(`Error al obtener tratamientos: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error obteniendo tratamientos:', error);
        throw error;
    }
};

/**
 * Obtiene un tratamiento específico
 * @param {string} tratamientoId - ID del tratamiento
 * @param {string} token - Token de autenticación
 * @returns {Promise} Promesa con los datos del tratamiento
 */
export const getTratamientoById = async (tratamientoId, token = null) => {
    try {
        const response = await fetch(getApiUrl(`${TRATAMIENTOS_ENDPOINT}${tratamientoId}/`), {
            method: 'GET',
            headers: getAuthHeaders(token, 'medico')
        });

        if (!response.ok) {
            throw new Error(`Error al obtener tratamiento: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error obteniendo tratamiento:', error);
        throw error;
    }
};

/**
 * Actualiza un tratamiento existente
 * @param {string} tratamientoId - ID del tratamiento
 * @param {Object} updateData - Datos a actualizar
 * @param {string} token - Token de autenticación
 * @returns {Promise} Promesa con la respuesta de la API
 */
export const updateTratamiento = async (tratamientoId, updateData, token = null) => {
    try {
        const response = await fetch(getApiUrl(`${TRATAMIENTOS_ENDPOINT}${tratamientoId}/`), {
            method: 'PATCH',
            headers: getAuthHeaders(token, 'medico'),
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error(`Error al actualizar tratamiento: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error actualizando tratamiento:', error);
        throw error;
    }
};

/**
 * Suspende/cancela un tratamiento
 * @param {string} tratamientoId - ID del tratamiento
 * @param {string} motivo - Motivo de la suspensión
 * @param {string} token - Token de autenticación
 * @returns {Promise} Promesa con la respuesta de la API
 */
export const suspenderTratamiento = async (tratamientoId, motivo, token = null) => {
    try {
        const response = await fetch(getApiUrl(`${TRATAMIENTOS_ENDPOINT}${tratamientoId}/suspender/`), {
            method: 'POST',
            headers: getAuthHeaders(token, 'medico'),
            body: JSON.stringify({ 
                activo: false, 
                motivo_cancelacion: motivo,
                fecha_finalizacion: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`Error al suspender tratamiento: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error suspendiendo tratamiento:', error);
        throw error;
    }
};

/**
 * Obtiene las estadísticas de cumplimiento de un tratamiento
 * @param {string} tratamientoId - ID del tratamiento
 * @param {string} token - Token de autenticación
 * @returns {Promise} Promesa con las estadísticas de cumplimiento
 */
export const getCumplimientoTratamiento = async (tratamientoId, token = null) => {
    try {
        const response = await fetch(getApiUrl(`${TRATAMIENTOS_ENDPOINT}${tratamientoId}/cumplimiento/`), {
            method: 'GET',
            headers: getAuthHeaders(token, 'medico')
        });

        if (!response.ok) {
            throw new Error(`Error al obtener cumplimiento: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error obteniendo cumplimiento:', error);
        throw error;
    }
};

/**
 * Obtiene el historial de tratamientos de un paciente
 * @param {string} pacienteId - ID del paciente
 * @param {string} token - Token de autenticación
 * @returns {Promise} Promesa con el historial de tratamientos
 */
export const getHistorialTratamientos = async (pacienteId, token = null) => {
    try {
        const response = await fetch(getApiUrl(`${TRATAMIENTOS_ENDPOINT}paciente/${pacienteId}/historial/`), {
            method: 'GET',
            headers: getAuthHeaders(token, 'medico')
        });

        if (!response.ok) {
            throw new Error(`Error al obtener historial: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        throw error;
    }
};

/**
 * Crea un nuevo medicamento
 * @param {Object} medicamentoData - Datos del medicamento
 * @param {string} token - Token de autenticación
 * @returns {Promise} Promesa con la respuesta de la API
 */
export const createMedicamento = async (medicamentoData, token = null) => {
    try {
        const response = await fetch(getApiUrl(MEDICAMENTOS_ENDPOINT), {
            method: 'POST',
            headers: getAuthHeaders(token, 'medico'),
            body: JSON.stringify(medicamentoData)
        });

        if (!response.ok) {
            throw new Error(`Error al crear medicamento: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creando medicamento:', error);
        throw error;
    }
};

/**
 * Obtiene alertas de un paciente
 * @param {string} pacienteId - ID del paciente
 * @param {string} token - Token de autenticación
 * @returns {Promise} Promesa con las alertas
 */
export const getAlertas = async (pacienteId, token = null) => {
    try {
        const response = await fetch(getApiUrl(`${ALERTAS_ENDPOINT}paciente/${pacienteId}/`), {
            method: 'GET',
            headers: getAuthHeaders(token, 'medico')
        });

        if (!response.ok) {
            throw new Error(`Error al obtener alertas: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error obteniendo alertas:', error);
        throw error;
    }
};

/**
 * Maneja errores de respuesta de la API
 * @param {Response} response - Respuesta de fetch
 * @returns {Promise} Promesa que se resuelve con los datos o rechaza con error
 */
export const handleApiResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }
    return response.json();
};

/**
 * Parsea la respuesta de la API para tratamientos
 * @param {Object} data - Datos de la respuesta
 * @returns {Array} Array de tratamientos procesados
 */
export const parseApiResponse = (data) => {
    console.log('Parseando respuesta API tratamientos:', data);

    if (Array.isArray(data)) {
        return data;
    }

    const possibleArrayPaths = ['results', 'tratamientos', 'data'];
    for (const path of possibleArrayPaths) {
        if (data && Array.isArray(data[path])) {
            console.log(`Encontrado array en ${path}:`, data[path]);
            return data[path];
        }
    }

    console.log('No se encontró array en la respuesta, devolviendo data original:', data);
    return data;
};
