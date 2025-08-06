import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './GenerarTratamiento.css';

const GenerarTratamiento = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  
  const [paciente, setPaciente] = useState(null);
  const [episodios, setEpisodios] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formulario, setFormulario] = useState({
    episodio_id: '',
    medicamento_principal: '',
    dosis: '',
    frecuencia_horas: 8,
    duracion_dias: 14,
    instrucciones: '',
    recomendaciones: '',
    hora_inicio: '08:00'
  });

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

      // Cargar episodios del paciente
      const episodiosResponse = await fetch(`http://localhost:8000/api/evaluacion/episodios/?paciente=${pacienteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (episodiosResponse.ok) {
        const episodiosData = await episodiosResponse.json();
        setEpisodios(episodiosData.results || episodiosData);
      }

      // Cargar medicamentos disponibles
      const medicamentosResponse = await fetch('http://localhost:8000/api/tratamiento/medicamentos/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (medicamentosResponse.ok) {
        const medicamentosData = await medicamentosResponse.json();
        setMedicamentos(medicamentosData.results || medicamentosData);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generarTratamientoSugerido = (categoria) => {
    let sugerencia = {};
    
    switch (categoria) {
      case 'Migraña sin aura':
        sugerencia = {
          dosis: '50mg',
          frecuencia_horas: 24,
          duracion_dias: 28,
          instrucciones: 'Tomar en caso de episodio agudo de migraña',
          recomendaciones: 'Evitar factores desencadenantes conocidos. Mantener hidratación adecuada.',
          hora_inicio: '08:00'
        };
        break;
      case 'Migraña con aura':
        sugerencia = {
          dosis: '100mg',
          frecuencia_horas: 24,
          duracion_dias: 42,
          instrucciones: 'Tomar tan pronto aparezcan los síntomas de aura',
          recomendaciones: 'Mantener diario de síntomas y factores desencadenantes. Reposo en lugar oscuro.',
          hora_inicio: '08:00'
        };
        break;
      case 'Cefalea de tipo tensional':
        sugerencia = {
          dosis: '25mg',
          frecuencia_horas: 24,
          duracion_dias: 56,
          instrucciones: 'Tratamiento preventivo, tomar diariamente',
          recomendaciones: 'Técnicas de relajación y manejo del estrés. Ejercicio regular.',
          hora_inicio: '22:00'
        };
        break;
      default:
        sugerencia = {
          dosis: '400mg',
          frecuencia_horas: 8,
          duracion_dias: 14,
          instrucciones: 'Tomar según necesidad para el dolor',
          recomendaciones: 'Consultar si los síntomas persisten o empeoran.',
          hora_inicio: '08:00'
        };
    }
    
    setFormulario(prev => ({
      ...prev,
      ...sugerencia
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formulario.episodio_id || !formulario.medicamento_principal) {
      alert('Por favor seleccione un episodio y un medicamento');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const tratamientoData = {
        episodio: formulario.episodio_id,
        paciente: pacienteId,
        medicamentos: [formulario.medicamento_principal],
        fecha_inicio: new Date().toISOString().split('T')[0],
        activo: true,
        cumplimiento: 0.0,
        observaciones: `Dosis: ${formulario.dosis}, Frecuencia: cada ${formulario.frecuencia_horas}h, Duración: ${formulario.duracion_dias} días. ${formulario.instrucciones}`
      };

      const response = await fetch('http://localhost:8000/api/tratamiento/tratamientos/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tratamientoData),
      });

      if (response.ok) {
        alert('¡Tratamiento creado exitosamente!');
        navigate(`/medico/tratamiento/seguimiento/${pacienteId}`);
      } else {
        const errorData = await response.json();
        console.error('Error al crear tratamiento:', errorData);
        alert('Error al crear el tratamiento. Verifique los datos.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión al crear el tratamiento');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando datos del paciente...</p>
      </div>
    );
  }

  return (
    <div className="generar-tratamiento">
      <header className="page-header">
        <div className="header-content">
          <button onClick={() => navigate('/medico/dashboard')} className="btn-back">
            ← Volver al Dashboard
          </button>
          <h1>Generar Nuevo Tratamiento</h1>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          {paciente && (
            <div className="patient-info-card">
              <h2>Información del Paciente</h2>
              <div className="patient-details">
                <p><strong>Nombre:</strong> {paciente.first_name} {paciente.last_name}</p>
                <p><strong>Email:</strong> {paciente.email}</p>
                <p><strong>Cédula:</strong> {paciente.cedula}</p>
                {paciente.telefono && <p><strong>Teléfono:</strong> {paciente.telefono}</p>}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="treatment-form">
            <div className="form-section">
              <h3>Seleccionar Episodio</h3>
              {episodios.length === 0 ? (
                <div className="no-episodes">
                  <p>No hay episodios registrados para este paciente.</p>
                  <p>El paciente debe registrar un episodio primero.</p>
                </div>
              ) : (
                <div className="episodes-grid">
                  {episodios.map((episodio) => (
                    <div 
                      key={episodio.id} 
                      className={`episode-card ${formulario.episodio_id == episodio.id ? 'selected' : ''}`}
                      onClick={() => {
                        setFormulario(prev => ({ ...prev, episodio_id: episodio.id }));
                        generarTratamientoSugerido(episodio.categoria_diagnostica);
                      }}
                    >
                      <h4>{episodio.categoria_diagnostica}</h4>
                      <p><strong>Severidad:</strong> {episodio.severidad}</p>
                      <p><strong>Duración:</strong> {episodio.duracion_cefalea_horas}h</p>
                      <p><strong>Localización:</strong> {episodio.localizacion}</p>
                      {episodio.presencia_aura && <span className="aura-badge">Con Aura</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Medicamento Principal</h3>
              <select 
                name="medicamento_principal" 
                value={formulario.medicamento_principal}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccionar medicamento...</option>
                {medicamentos.map((medicamento) => (
                  <option key={medicamento.id} value={medicamento.id}>
                    {medicamento.nombre} - {medicamento.caracteristica}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Dosis</label>
                <input
                  type="text"
                  name="dosis"
                  value={formulario.dosis}
                  onChange={handleInputChange}
                  placeholder="ej: 50mg"
                  required
                />
              </div>

              <div className="form-group">
                <label>Frecuencia (horas)</label>
                <select name="frecuencia_horas" value={formulario.frecuencia_horas} onChange={handleInputChange}>
                  <option value={4}>Cada 4 horas</option>
                  <option value={6}>Cada 6 horas</option>
                  <option value={8}>Cada 8 horas</option>
                  <option value={12}>Cada 12 horas</option>
                  <option value={24}>Una vez al día</option>
                </select>
              </div>

              <div className="form-group">
                <label>Duración (días)</label>
                <input
                  type="number"
                  name="duracion_dias"
                  value={formulario.duracion_dias}
                  onChange={handleInputChange}
                  min="1"
                  max="90"
                  required
                />
              </div>

              <div className="form-group">
                <label>Hora de inicio</label>
                <input
                  type="time"
                  name="hora_inicio"
                  value={formulario.hora_inicio}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Instrucciones</label>
              <textarea
                name="instrucciones"
                value={formulario.instrucciones}
                onChange={handleInputChange}
                rows={3}
                placeholder="Instrucciones específicas para el paciente..."
                required
              />
            </div>

            <div className="form-group">
              <label>Recomendaciones</label>
              <textarea
                name="recomendaciones"
                value={formulario.recomendaciones}
                onChange={handleInputChange}
                rows={3}
                placeholder="Recomendaciones adicionales y cuidados..."
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/medico/dashboard')} className="btn-cancel">
                Cancelar
              </button>
              <button type="submit" className="btn-submit" disabled={!formulario.episodio_id || !formulario.medicamento_principal}>
                Generar Tratamiento
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default GenerarTratamiento;
