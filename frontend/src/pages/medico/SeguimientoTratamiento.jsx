import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SeguimientoTratamiento.css';

const SeguimientoTratamiento = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  
  const [paciente, setPaciente] = useState(null);
  const [tratamientos, setTratamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [pacienteId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Cargar información del paciente
      const pacienteResponse = await fetch(`http://localhost:8000/api/usuarios/${pacienteId}/`, {
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
      const tratamientosResponse = await fetch(`http://localhost:8000/api/tratamientos/?paciente=${pacienteId}`, {
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

  const actualizarCumplimiento = async (tratamientoId, nuevoCumplimiento) => {
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
          cumplimiento: nuevoCumplimiento
        }),
      });

      if (response.ok) {
        // Actualizar el estado local
        setTratamientos(prev => prev.map(t => 
          t.id === tratamientoId 
            ? { ...t, cumplimiento: nuevoCumplimiento }
            : t
        ));
      } else {
        alert('Error al actualizar el cumplimiento');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión al actualizar');
    } finally {
      setActualizando(null);
    }
  };

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

  const obtenerColorCumplimiento = (cumplimiento) => {
    if (cumplimiento >= 80) return '#28a745'; // Verde
    if (cumplimiento >= 60) return '#ffc107'; // Amarillo
    return '#dc3545'; // Rojo
  };

  const calcularDiasRestantes = (fechaInicio, observaciones) => {
    // Extraer duración de las observaciones
    const match = observaciones.match(/Duración:\s*(\d+)\s*días/i);
    if (!match) return null;
    
    const duracionDias = parseInt(match[1]);
    const inicio = new Date(fechaInicio);
    const ahora = new Date();
    const diasTranscurridos = Math.floor((ahora - inicio) / (1000 * 60 * 60 * 24));
    const diasRestantes = duracionDias - diasTranscurridos;
    
    return Math.max(0, diasRestantes);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando tratamientos...</p>
      </div>
    );
  }

  return (
    <div className="seguimiento-tratamiento">
      <header className="page-header">
        <div className="header-content">
          <button onClick={() => navigate('/medico/dashboard')} className="btn-back">
            ← Volver al Dashboard
          </button>
          <h1>Seguimiento de Tratamientos</h1>
          <button 
            onClick={() => navigate(`/medico/tratamiento/generar/${pacienteId}`)}
            className="btn-new-treatment"
          >
            + Nuevo Tratamiento
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          {paciente && (
            <div className="patient-info-card">
              <h2>Paciente: {paciente.first_name} {paciente.last_name}</h2>
              <div className="patient-details">
                <p><strong>Email:</strong> {paciente.email}</p>
                <p><strong>Cédula:</strong> {paciente.cedula}</p>
                {paciente.telefono && <p><strong>Teléfono:</strong> {paciente.telefono}</p>}
              </div>
            </div>
          )}

          {tratamientos.length === 0 ? (
            <div className="no-treatments">
              <div className="no-treatments-content">
                <h3>No hay tratamientos registrados</h3>
                <p>Este paciente no tiene tratamientos activos o anteriores.</p>
                <button 
                  onClick={() => navigate(`/medico/tratamiento/generar/${pacienteId}`)}
                  className="btn-create-first"
                >
                  Crear Primer Tratamiento
                </button>
              </div>
            </div>
          ) : (
            <div className="treatments-section">
              <h3>Tratamientos ({tratamientos.length})</h3>
              
              <div className="treatments-grid">
                {tratamientos.map((tratamiento) => {
                  const diasRestantes = calcularDiasRestantes(tratamiento.fecha_inicio, tratamiento.observaciones);
                  
                  return (
                    <div key={tratamiento.id} className={`treatment-card ${tratamiento.activo ? 'active' : 'inactive'}`}>
                      <div className="treatment-header">
                        <div className="treatment-status">
                          <span className={`status-badge ${tratamiento.activo ? 'active' : 'inactive'}`}>
                            {tratamiento.activo ? 'Activo' : 'Suspendido'}
                          </span>
                          {diasRestantes !== null && tratamiento.activo && (
                            <span className="days-remaining">
                              {diasRestantes} días restantes
                            </span>
                          )}
                        </div>
                        
                        <div className="treatment-actions">
                          {tratamiento.activo ? (
                            <button 
                              onClick={() => cambiarEstadoTratamiento(tratamiento.id, false)}
                              className="btn-suspend"
                              disabled={actualizando === tratamiento.id}
                            >
                              Suspender
                            </button>
                          ) : (
                            <button 
                              onClick={() => cambiarEstadoTratamiento(tratamiento.id, true)}
                              className="btn-reactivate"
                              disabled={actualizando === tratamiento.id}
                            >
                              Reactivar
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="treatment-info">
                        <p><strong>Fecha de inicio:</strong> {new Date(tratamiento.fecha_inicio).toLocaleDateString()}</p>
                        
                        <div className="compliance-section">
                          <div className="compliance-header">
                            <label><strong>Cumplimiento:</strong></label>
                            <span 
                              className="compliance-percentage"
                              style={{ color: obtenerColorCumplimiento(tratamiento.cumplimiento) }}
                            >
                              {tratamiento.cumplimiento.toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="compliance-controls">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={tratamiento.cumplimiento}
                              onChange={(e) => actualizarCumplimiento(tratamiento.id, parseFloat(e.target.value))}
                              disabled={actualizando === tratamiento.id}
                              className="compliance-slider"
                              style={{
                                background: `linear-gradient(to right, ${obtenerColorCumplimiento(tratamiento.cumplimiento)} 0%, ${obtenerColorCumplimiento(tratamiento.cumplimiento)} ${tratamiento.cumplimiento}%, #ddd ${tratamiento.cumplimiento}%, #ddd 100%)`
                              }}
                            />
                            
                            <div className="quick-compliance">
                              {[25, 50, 75, 100].map(valor => (
                                <button
                                  key={valor}
                                  onClick={() => actualizarCumplimiento(tratamiento.id, valor)}
                                  className={`btn-quick ${tratamiento.cumplimiento === valor ? 'active' : ''}`}
                                  disabled={actualizando === tratamiento.id}
                                >
                                  {valor}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="treatment-details">
                          <h4>Detalles del Tratamiento:</h4>
                          <div className="observaciones">
                            {tratamiento.observaciones.split('.').map((observacion, index) => (
                              observacion.trim() && (
                                <p key={index} className="observacion-item">
                                  {observacion.trim()}.
                                </p>
                              )
                            ))}
                          </div>
                        </div>

                        {tratamiento.medicamentos && tratamiento.medicamentos.length > 0 && (
                          <div className="medications-list">
                            <h4>Medicamentos:</h4>
                            <ul>
                              {tratamiento.medicamentos.map((med, index) => (
                                <li key={index}>{med.nombre || `Medicamento ${med}`}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SeguimientoTratamiento;
