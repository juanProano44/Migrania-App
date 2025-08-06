import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/tratamientos.css";

function Tratamientos() {
    const navigate = useNavigate();
    const { pacienteId } = useParams();
    
    // Si no hay pacienteId, usar el ID de prueba o redirigir
    const idPaciente = pacienteId || '3';
    
    const [paciente, setPaciente] = useState(null);
    const [tratamientos, setTratamientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actualizando, setActualizando] = useState(null);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Cargar información del paciente
                const pacienteResponse = await fetch(`http://localhost:8000/api/usuarios/${idPaciente}/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (pacienteResponse.ok) {
                    const pacienteData = await pacienteResponse.json();
                    setPaciente(pacienteData);
                }

                // Cargar tratamientos del paciente
                const tratamientosResponse = await fetch(`http://localhost:8000/api/tratamientos/?paciente=${idPaciente}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (tratamientosResponse.ok) {
                    const tratamientosData = await tratamientosResponse.json();
                    setTratamientos(tratamientosData.results || tratamientosData);
                }

            } catch (error) {
                console.error('Error al cargar datos:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [idPaciente]);

    const cambiarEstadoTratamiento = async (tratamientoId, activo) => {
        setActualizando(tratamientoId);
        
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`http://localhost:8000/api/tratamientos/${tratamientoId}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    activo: activo
                }),
            });

            if (response.ok) {
                setTratamientos(prev => prev.map(t => 
                    t.id === tratamientoId 
                        ? { ...t, activo: activo }
                        : t
                ));
                
                const accion = activo ? 'reactivado' : 'suspendido';
                alert(`Tratamiento ${accion} exitosamente`);
            } else {
                alert('Error al cambiar el estado del tratamiento');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        } finally {
            setActualizando(null);
        }
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-ES');
    };

    if (loading) {
        return (
            <div className="tratamientos">
                <div className="loading-container">
                    <p>Cargando tratamientos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tratamientos">
            <header>
                <div className="user-info">
                    <span className="user-icon">👤</span>
                    <span className="user-name">Dr. X</span>
                </div>
            </header>

            <div className="patient-info">
                <h1>{paciente ? `${paciente.first_name} ${paciente.last_name}` : 'Paciente'} - Tratamientos</h1>
                <button
                    className="history-button"
                    onClick={() => navigate("/historial")}
                >
                    Historial
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                    <tr>
                        <th># Tratamiento</th>
                        <th>Episodio</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>% Cumplimiento</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tratamientos.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>
                                No hay tratamientos registrados
                            </td>
                        </tr>
                    ) : (
                        tratamientos.map((t) => (
                            <tr key={t.id}>
                                <td>{t.id}</td>
                                <td>{t.episodio ? t.episodio.id || 'N/A' : 'N/A'}</td>
                                <td>{formatearFecha(t.fecha_inicio)}</td>
                                <td>{t.activo ? 'Activo' : 'Finalizado'}</td>
                                <td>{t.cumplimiento?.toFixed(1) || '0'}%</td>
                                <td className="acciones">
                                    <button
                                        className="edit-button"
                                        onClick={() => navigate(`/seguimiento/tratamientos/editar/${t.id}`)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className={t.activo ? "delete-button" : "edit-button"}
                                        onClick={() => cambiarEstadoTratamiento(t.id, !t.activo)}
                                        disabled={actualizando === t.id}
                                    >
                                        {actualizando === t.id ? 'Actualizando...' : (t.activo ? 'Suspender' : 'Reactivar')}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            <div className="actions">
                <button
                    className="create-treatment"
                    onClick={() => navigate("/seguimiento/tratamientos/crearTratamiento")}
                >
                    Nuevo tratamiento
                </button>
                <button className="cancel" onClick={() => navigate(-1)}>
                    Cancelar
                </button>
            </div>
        </div>
    );
}

export default Tratamientos;
