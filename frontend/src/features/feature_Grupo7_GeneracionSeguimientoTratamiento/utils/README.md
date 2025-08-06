# Utils - Feature Generación y Seguimiento de Tratamiento

Esta carpeta contiene todas las utilidades necesarias para la feature de generación y seguimiento de tratamientos de migraña.

## Estructura de Archivos

### `apiUtils.js`
Utilidades para interactuar con la API del backend de tratamientos.

**Funciones principales:**
- `createTratamiento()` - Crear nuevos tratamientos
- `getTratamientosByPaciente()` - Obtener tratamientos de un paciente
- `updateTratamiento()` - Actualizar tratamientos existentes
- `suspenderTratamiento()` - Suspender/cancelar tratamientos
- `getCumplimientoTratamiento()` - Obtener estadísticas de cumplimiento
- `getHistorialTratamientos()` - Obtener historial completo

### `tratamientoUtils.js`
Lógica de negocio y transformación de datos de tratamientos.

**Funciones principales:**
- `transformTratamiento()` - Transformar datos para la UI
- `validateTratamientoData()` - Validar datos de tratamiento
- `transformFormDataForAPI()` - Preparar datos para envío a API
- `calculateCumplimiento()` - Calcular porcentaje de cumplimiento
- `generateRecommendations()` - Generar recomendaciones personalizadas
- `evaluateTreatmentAction()` - Determinar acciones basadas en cumplimiento

### `dateUtils.js`
Utilidades para manejo de fechas y cronogramas de medicación.

**Funciones principales:**
- `formatDate()` - Formatear fechas para mostrar
- `calculateEndDate()` - Calcular fecha de finalización
- `generateMedicationSchedule()` - Crear horarios de medicación
- `getNextDose()` - Obtener próxima dosis
- `getMissedDoses()` - Identificar dosis perdidas
- `calculateTreatmentProgress()` - Calcular progreso del tratamiento

### `validationUtils.js`
Validaciones de formularios y datos de entrada.

**Funciones principales:**
- `validateTratamientoForm()` - Validar formulario completo
- `validateMedicamento()` - Validar datos de medicamento
- `validateSuspenderTratamiento()` - Validar datos de suspensión
- `validateCumplimiento()` - Validar porcentaje de cumplimiento
- `validateMultipleFields()` - Validar múltiples campos

### `formatUtils.js`
Utilidades para formateo y presentación de datos.

**Funciones principales:**
- `formatEstadoTratamiento()` - Formatear estado con colores
- `formatCumplimiento()` - Formatear porcentaje con clasificación
- `formatMedicamento()` - Formatear información de medicamento
- `formatTreatmentForTable()` - Formatear tratamiento para tabla
- `truncateText()` - Truncar texto largo

### `constants.js`
Constantes y configuraciones de la feature.

**Constantes principales:**
- `ESTADOS_TRATAMIENTO` - Estados posibles de tratamiento
- `TIPOS_MIGRANA` - Tipos de migraña soportados
- `FRECUENCIAS_MEDICAMENTOS` - Frecuencias comunes
- `MEDICAMENTOS_COMUNES` - Medicamentos por categoría
- `RECOMENDACIONES_BASE` - Recomendaciones por género
- `MENSAJES_VALIDACION` - Mensajes de error estándar

### `index.js`
Archivo principal que exporta todas las utilidades y proporciona funciones helpers adicionales.

**Funciones helpers:**
- `initializeEmptyTreatment()` - Inicializar tratamiento vacío
- `processFormData()` - Procesar y validar formulario completo
- `processTreatmentList()` - Procesar lista para tabla
- `handleApiCall()` - Manejar llamadas API con errores
- `calculateTreatmentStatistics()` - Calcular estadísticas

## Uso

### Importación Individual
```javascript
import { createTratamiento, formatEstadoTratamiento } from './utils/apiUtils.js';
import { validateTratamientoForm } from './utils/validationUtils.js';
```

### Importación desde index
```javascript
import { 
    createTratamiento, 
    formatEstadoTratamiento,
    validateTratamientoForm,
    processFormData
} from './utils/index.js';
```

## Ejemplos de Uso

### Crear un tratamiento
```javascript
import { processFormData, createTratamiento, handleApiCall } from './utils/index.js';

const handleSubmit = async (formData, userInfo) => {
    // Procesar y validar datos
    const { success, data, errors } = processFormData(formData, userInfo);
    
    if (!success) {
        setErrors(errors);
        return;
    }
    
    // Enviar a API
    const result = await handleApiCall(createTratamiento(data));
    
    if (result.success) {
        console.log('Tratamiento creado:', result.data);
    } else {
        console.error('Error:', result.error);
    }
};
```

### Formatear lista de tratamientos
```javascript
import { processTreatmentList } from './utils/index.js';

const tratamientosFormateados = processTreatmentList(tratamientos, {
    sortBy: 'fecha_inicio',
    sortOrder: 'desc',
    filterBy: 'activo',
    formatForTable: true
});
```

### Validar medicamento
```javascript
import { validateMedicamento } from './utils/index.js';

const { isValid, errores } = validateMedicamento({
    nombre: 'Ibuprofeno',
    dosis: 400,
    caracteristica: '400mg',
    frecuencia_horas: 8,
    duracion_dias: 5
});
```

## Integración con Componentes

Los utils están diseñados para integrarse fácilmente con los componentes de React:

```javascript
// En CrearTratamiento.jsx
import { 
    initializeEmptyTreatment, 
    createEmptyMedicamento,
    validateTratamientoForm,
    createTratamiento
} from '../utils/index.js';

function CrearTratamiento() {
    const [formData, setFormData] = useState(initializeEmptyTreatment());
    
    const handleAddMedicamento = () => {
        setFormData(prev => ({
            ...prev,
            medicamentos: [...prev.medicamentos, createEmptyMedicamento()]
        }));
    };
    
    // ... resto del componente
}
```

## Consideraciones

1. **Manejo de Errores**: Todas las funciones de API utilizan un formato estándar de respuesta con `success`, `data` y `error`.

2. **Validación**: Las validaciones son exhaustivas y proporcionan mensajes de error específicos en español.

3. **Formateo**: Los formatos están adaptados a la localización española (fechas, números, etc.).

4. **Extensibilidad**: Fácil agregar nuevas validaciones, formatos o constantes.

5. **Consistencia**: Todos los utils siguen patrones similares de nomenclatura y estructura.

## Mantenimiento

Para agregar nuevas utilidades:

1. Agregar la función en el archivo correspondiente
2. Exportarla en el archivo individual
3. Re-exportarla en `index.js` si es necesario
4. Actualizar este README con la documentación

Para modificar constantes:
1. Actualizar `constants.js`
2. Verificar que no se rompan dependencias en otros archivos
3. Actualizar tests si existen
