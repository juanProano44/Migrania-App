import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/crearTratamiento.css";

const recomendacionesHombre = [
    "Rutina regular de sueño",
    "Ejercicio moderado",
    "Control del estrés",
    "Hidratación adecuada",
    "Ambiente oscuro y silencioso",
    "Compresión fría o tibia",
    "Evitar esfuerzo físico",
    "Líquidos en pequeñas cantidades"
];

const recomendacionesMujer = [
    ...recomendacionesHombre,
    "Analgésicos durante menstruación",
    "Consulta ginecológica"
];

function CrearTratamiento({ genero = "hombre" }) {
    const navigate = useNavigate();
    const [tratamientos, setTratamientos] = useState([
        { cantidad: 1, medicamento: "", caracteristica: "", frecuencia: "", duracion: "" }
    ]);
    const [recomendacionesSeleccionadas, setRecomendacionesSeleccionadas] = useState([]);
    const [observaciones, setObservaciones] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);  // Estado para mostrar el modal

    const recomendaciones = genero === "mujer" ? recomendacionesMujer : recomendacionesHombre;

    const handleAddFila = () => {
        setTratamientos([
            ...tratamientos,
            { cantidad: 1, medicamento: "", caracteristica: "", frecuencia: "", duracion: "" }
        ]);
    };

    const handleRemoveFila = (index) => {
        const nuevos = tratamientos.filter((_, i) => i !== index);
        setTratamientos(nuevos);
    };

    const handleInputChange = (index, field, value) => {
        const nuevos = [...tratamientos];
        nuevos[index][field] = value;
        setTratamientos(nuevos);
    };

    const handleToggleRecomendacion = (texto) => {
        setRecomendacionesSeleccionadas((prev) =>
            prev.includes(texto)
                ? prev.filter((r) => r !== texto)
                : [...prev, texto]
        );
    };

    const handleEnviarTratamiento = async () => {
        try {
            // Validar que hay al menos un medicamento
            if (tratamientos.length === 0 || !tratamientos[0].medicamento) {
                alert('Por favor, agregue al menos un medicamento');
                return;
            }

            const token = localStorage.getItem('token') || localStorage.getItem('access');
            if (!token) {
                alert('No hay sesión activa. Por favor, inicie sesión nuevamente.');
                navigate('/login');
                return;
            }

            // Crear un ID de episodio único basado en timestamp para evitar conflictos
            // Preparar datos del tratamiento
            const tratamientoData = {
                // Omitimos el episodio por ahora para evitar conflictos
                paciente: 1, // ID del perfil de paciente de prueba
                medicamentos: tratamientos.map(t => ({
                    nombre: t.medicamento,
                    dosis: t.caracteristica,
                    caracteristica: t.caracteristica,
                    frecuencia_horas: parseInt(t.frecuencia) || 8,
                    duracion_dias: parseInt(t.duracion) || 7,
                    hora_de_inicio: "08:00"
                })),
                recomendaciones: recomendacionesSeleccionadas,
                observaciones: observaciones,
                fecha_inicio: new Date().toISOString().split('T')[0],
                activo: true,
                cumplimiento: 0.0
            };

            console.log('Enviando tratamiento:', tratamientoData);

            const response = await fetch('http://127.0.0.1:8000/api/tratamientos/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tratamientoData),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Tratamiento creado:', result);
                setMostrarModal(true);
            } else {
                const errorData = await response.json();
                console.error('Error del servidor:', errorData);
                
                // Si el error es por episodio duplicado, intentamos sin episodio
                if (errorData.episodio && errorData.episodio.includes('unique')) {
                    alert('Este episodio ya tiene un tratamiento. Creando tratamiento sin episodio asociado...');
                    // Aquí podrías intentar de nuevo sin el campo episodio
                } else {
                    alert(`Error al crear el tratamiento: ${JSON.stringify(errorData)}`);
                }
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('Error de conexión al crear el tratamiento');
        }
    };

    const handleCerrarModal = () => {
        setMostrarModal(false);
        // Redirigir a seguimiento en lugar de home
        navigate('/seguimiento');
    };

    return (
        <div className="crear-tratamiento-container">
            <header>
                <div className="crear-tratamiento-user-info">
                    <span className="user-icon">👤</span>
                    <span className="user-name">Dr. X</span>
                </div>
            </header>

            <div className="crear-tratamiento-patient-info">
                <h1>Paciente X – Crear Tratamiento</h1>
            </div>

            <div className="crear-tratamiento-table-container">
                <table className="crear-tratamiento-table">
                    <thead>
                    <tr>
                        <th>Cantidad</th>
                        <th>Medicamento</th>
                        <th>Característica</th>
                        <th>Frecuencia</th>
                        <th>Duración Tratamiento</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tratamientos.map((fila, index) => (
                        <tr key={index}>
                            <td>
                                <input
                                    type="number"
                                    placeholder="1"
                                    min="1"
                                    value={fila.cantidad}
                                    onChange={(e) => handleInputChange(index, "cantidad", parseInt(e.target.value))}
                                    className="crear-tratamiento-input"
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Ej: Analgésicos"
                                    value={fila.medicamento}
                                    onChange={(e) => handleInputChange(index, "medicamento", e.target.value)}
                                    className="crear-tratamiento-input"
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Ej: 500mg"
                                    value={fila.caracteristica}
                                    onChange={(e) => handleInputChange(index, "caracteristica", e.target.value)}
                                    className="crear-tratamiento-input"
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Ej: C/8h"
                                    value={fila.frecuencia}
                                    onChange={(e) => handleInputChange(index, "frecuencia", e.target.value)}
                                    className="crear-tratamiento-input"
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    placeholder="Ej: 3 días"
                                    value={fila.duracion}
                                    onChange={(e) => handleInputChange(index, "duracion", e.target.value)}
                                    className="crear-tratamiento-input"
                                />
                            </td>
                            <td className="crear-tratamiento-acciones-botones">
                                <button className="crear-tratamiento-add-button" onClick={handleAddFila}>+</button>
                                {tratamientos.length > 1 && (
                                    <button className="crear-tratamiento-remove-button" onClick={() => handleRemoveFila(index)}>-</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div className="crear-tratamiento-recomendaciones">
                    <h3>Recomendaciones</h3>
                    <div className="crear-tratamiento-lista-recomendaciones">
                        {recomendaciones.map((texto, i) => (
                            <label key={i}>
                                <input
                                    type="checkbox"
                                    checked={recomendacionesSeleccionadas.includes(texto)}
                                    onChange={() => handleToggleRecomendacion(texto)}
                                />
                                {" "}{texto}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Campo de Observaciones */}
                <div className="crear-tratamiento-observaciones">
                    <h3>Observaciones</h3>
                    <textarea
                        className="crear-tratamiento-textarea"
                        placeholder="Escriba observaciones adicionales sobre el tratamiento..."
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        rows={4}
                    />
                </div>
            </div>

            <div className="crear-tratamiento-actions">
                <button className="crear-tratamiento-create-button" onClick={handleEnviarTratamiento}>
                    Enviar tratamiento
                </button>
                <button className="crear-tratamiento-cancel-button" onClick={() => navigate(-1)}>Regresar</button>
            </div>

            {/* Modal para confirmación */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>✅ Tratamiento Enviado Exitosamente</h2>
                        <p>El tratamiento ha sido guardado en la base de datos.</p>
                        <div style={{marginTop: '20px'}}>
                            <button onClick={handleCerrarModal} style={{marginRight: '10px'}}>
                                Ver Seguimiento
                            </button>
                            <button onClick={() => {setMostrarModal(false); navigate('/primerConsulta');}}>
                                Crear Otro Tratamiento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CrearTratamiento;
