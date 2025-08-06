import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/editarTratamiento.css";

const recomendacionesHombre = [
    "Mantener una rutina regular de sueño",
    "Realizar ejercicio de forma moderada",
    "Controlar los niveles de estrés",
    "Mantener una hidratación adecuada",
    "Buscar un ambiente oscuro y silencioso para descansar durante el episodio",
    "Realizar una compresión fría o tibia sobre la zona afectada",
    "Evitar cualquier tipo de esfuerzo físico mientras dure el episodio",
    "Ingerir líquidos en pequeñas cantidades y evitar alimentos pesados"
];

const recomendacionesMujer = [
    ...recomendacionesHombre,
    "Utilizar analgésicos adecuados durante el periodo menstrual",
    "Consultar con un ginecólogo sobre anticonceptivos hormonales"
];

function EditarTratamiento({ genero = "hombre" }) {
    const navigate = useNavigate();
    const { tratamientoId } = useParams();
    
    const [mostrarModal, setMostrarModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [tratamiento, setTratamiento] = useState(null);
    const [tratamientos, setTratamientos] = useState([]);
    const [recomendacionesSeleccionadas, setRecomendacionesSeleccionadas] = useState([]);
    const [observaciones, setObservaciones] = useState("");

    const recomendaciones = genero === "mujer" ? recomendacionesMujer : recomendacionesHombre;

    useEffect(() => {
        const cargarTratamiento = async () => {
            try {
                const token = localStorage.getItem('token');
                
                const response = await fetch(`http://127.0.0.1:8000/api/tratamientos/${tratamientoId}/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setTratamiento(data);
                    setObservaciones(data.observaciones || "");
                    setRecomendacionesSeleccionadas(data.recomendaciones || []);
                    
                    // Convertir medicamentos a formato de tabla
                    if (data.medicamentos && data.medicamentos.length > 0) {
                        const medicamentosFormateados = data.medicamentos.map(med => ({
                            cantidad: 1,
                            medicamento: med.nombre || med,
                            caracteristica: med.dosis || "500mg",
                            frecuencia: med.frecuencia_horas ? `C/${med.frecuencia_horas}h` : "C/8h",
                            duracion: med.duracion_dias ? `${med.duracion_dias} días` : "3 días"
                        }));
                        setTratamientos(medicamentosFormateados);
                    } else {
                        setTratamientos([
                            { cantidad: 1, medicamento: "Analgésicos", caracteristica: "500mg", frecuencia: "C/8h", duracion: "3 días" }
                        ]);
                    }
                }
            } catch (error) {
                console.error('Error al cargar tratamiento:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarTratamiento();
    }, [tratamientoId]);

    const handleAddFila = () => {
        setTratamientos([ ...tratamientos, { cantidad: 1, medicamento: "", caracteristica: "", frecuencia: "", duracion: "" } ]);
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

    const handleEnviar = async () => {
        setGuardando(true);
        
        try {
            const token = localStorage.getItem('token');
            
            // Convertir medicamentos del formato de tabla al formato de API
            const medicamentosFormateados = tratamientos.map(t => ({
                nombre: t.medicamento,
                dosis: t.caracteristica,
                caracteristica: t.caracteristica,
                frecuencia_horas: parseInt(t.frecuencia.replace(/\D/g, '')) || 8, // Extraer número de "C/8h"
                duracion_dias: parseInt(t.duracion.replace(/\D/g, '')) || 3, // Extraer número de "3 días"
                hora_de_inicio: "08:00" // Valor por defecto
            }));
            
            const datosActualizados = {
                medicamentos: medicamentosFormateados,
                recomendaciones: recomendacionesSeleccionadas,
                observaciones: observaciones
            };

            console.log('Enviando datos:', datosActualizados);

            const response = await fetch(`http://127.0.0.1:8000/api/tratamientos/${tratamientoId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosActualizados),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Respuesta exitosa:', result);
                alert('Tratamiento actualizado exitosamente');
                setMostrarModal(true);
            } else {
                const errorData = await response.text();
                console.error('Error response:', errorData);
                console.error('Status:', response.status);
                alert(`Error al actualizar el tratamiento: ${response.status}\n${errorData}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión: ' + error.message);
        } finally {
            setGuardando(false);
        }
    };

    const handleCerrarModal = () => {
        setMostrarModal(false);
        navigate(-1); // Volver a la página anterior
    };

    if (loading) {
        return (
            <div className="editar-tratamiento-container">
                <p>Cargando tratamiento...</p>
            </div>
        );
    }

    return (
        <div className="editar-tratamiento-container">
            <header className="editar-tratamiento-header">
                <div className="editar-tratamiento-user-info">
                    <span className="user-icon">👤</span>
                    <span className="user-name">Dr. X</span>
                </div>
            </header>

            <h1>
                {tratamiento?.paciente?.usuario?.first_name || 'Paciente'} {tratamiento?.paciente?.usuario?.last_name || ''} – Editar Tratamiento ID: {tratamientoId}
            </h1>

            <div className="editar-tratamiento-table-container">
                <table className="editar-tratamiento-table">
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
                                    min="1"
                                    value={fila.cantidad}
                                    onChange={(e) =>
                                        handleInputChange(index, "cantidad", parseInt(e.target.value))
                                    }
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={fila.medicamento}
                                    onChange={(e) =>
                                        handleInputChange(index, "medicamento", e.target.value)
                                    }
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={fila.caracteristica}
                                    onChange={(e) =>
                                        handleInputChange(index, "caracteristica", e.target.value)
                                    }
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={fila.frecuencia}
                                    onChange={(e) =>
                                        handleInputChange(index, "frecuencia", e.target.value)
                                    }
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    value={fila.duracion}
                                    onChange={(e) =>
                                        handleInputChange(index, "duracion", e.target.value)
                                    }
                                />
                            </td>
                            <td className="editar-tratamiento-botones">
                                <button className="editar-tratamiento-add" onClick={handleAddFila}>+</button>
                                {tratamientos.length > 1 && (
                                    <button
                                        className="editar-tratamiento-remove"
                                        onClick={() => handleRemoveFila(index)}
                                    >−</button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div className="editar-tratamiento-recomendaciones">
                    <h3>Recomendaciones</h3>
                    <div className="editar-tratamiento-lista">
                        {recomendaciones.map((texto, i) => (
                            <label key={i}>
                                <input
                                    type="checkbox"
                                    checked={recomendacionesSeleccionadas.includes(texto)}
                                    onChange={() => handleToggleRecomendacion(texto)}
                                />
                                {texto}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="editar-tratamiento-observaciones">
                    <h3>Observaciones</h3>
                    <textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Observaciones adicionales del tratamiento..."
                        rows="4"
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                </div>
            </div>

            <div className="editar-tratamiento-actions">
                <button 
                    className="editar-tratamiento-enviar" 
                    onClick={handleEnviar}
                    disabled={guardando}
                >
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button className="editar-tratamiento-cancelar" onClick={() => navigate(-1)}>
                    Regresar
                </button>
            </div>

            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Tratamiento modificado y enviado</h2>
                        <button onClick={handleCerrarModal}>Aceptar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EditarTratamiento;
