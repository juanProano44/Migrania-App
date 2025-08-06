import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardMedico.css';

const DashboardMedico = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medico, setMedico] = useState(null);

  useEffect(() => {
    cargarDatosMedico();
    cargarPacientes();
  }, []);

  const cargarDatosMedico = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/usuarios/perfil/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMedico(data);
      }
    } catch (error) {
      console.error('Error al cargar datos del médico:', error);
    }
  };

  const cargarPacientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/usuarios/pacientes/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPacientes(data.results || data);
      }
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const irAGenerarTratamiento = (pacienteId) => {
    navigate(`/medico/tratamiento/generar/${pacienteId}`);
  };

  const irASeguimientoTratamiento = (pacienteId) => {
    navigate(`/medico/tratamiento/seguimiento/${pacienteId}`);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-medico">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="doctor-info">
            <h1>Dashboard Médico</h1>
            {medico && (
              <p>Dr(a). {medico.first_name} {medico.last_name} - {medico.especializacion}</p>
            )}
          </div>
          <button onClick={cerrarSesion} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="container">
          <section className="actions-section">
            <h2>Gestión de Tratamientos</h2>
            <div className="actions-grid">
              <div className="action-card">
                <div className="action-icon">🩺</div>
                <h3>Generar Nuevo Tratamiento</h3>
                <p>Crear tratamiento personalizado para pacientes según su diagnóstico</p>
              </div>
              <div className="action-card">
                <div className="action-icon">📊</div>
                <h3>Seguimiento de Tratamientos</h3>
                <p>Monitorear el cumplimiento y evolución de tratamientos activos</p>
              </div>
              <div className="action-card">
                <div className="action-icon">📋</div>
                <h3>Evaluación de Episodios</h3>
                <p>Revisar y categorizar episodios de cefalea de pacientes</p>
              </div>
            </div>
          </section>

          <section className="patients-section">
            <h2>Pacientes Registrados</h2>
            {pacientes.length === 0 ? (
              <div className="no-patients">
                <p>No hay pacientes registrados en el sistema.</p>
                <p>Los pacientes deben registrarse primero para aparecer aquí.</p>
              </div>
            ) : (
              <div className="patients-grid">
                {pacientes.map((paciente) => (
                  <div key={paciente.id} className="patient-card">
                    <div className="patient-info">
                      <h3>{paciente.first_name} {paciente.last_name}</h3>
                      <p className="patient-email">{paciente.email}</p>
                      <p className="patient-cedula">Cédula: {paciente.cedula}</p>
                      {paciente.telefono && (
                        <p className="patient-phone">Tel: {paciente.telefono}</p>
                      )}
                    </div>
                    <div className="patient-actions">
                      <button 
                        onClick={() => irAGenerarTratamiento(paciente.id)}
                        className="btn-primary"
                      >
                        🩺 Generar Tratamiento
                      </button>
                      <button 
                        onClick={() => irASeguimientoTratamiento(paciente.id)}
                        className="btn-secondary"
                      >
                        📊 Ver Seguimiento
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Datos de prueba disponibles */}
          <section className="test-data-section">
            <h2>🧪 Datos de Prueba Disponibles</h2>
            <div className="test-info">
              <p><strong>Paciente de prueba creado en BDD:</strong></p>
              <ul>
                <li><strong>Email:</strong> paciente@test.com</li>
                <li><strong>Contraseña:</strong> testpass123</li>
                <li><strong>Nombre:</strong> Juan Pérez</li>
                <li><strong>Cédula:</strong> 1234567890</li>
              </ul>
              <p className="test-note">
                Este paciente tiene episodios y tratamientos de prueba generados por las pruebas BDD.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DashboardMedico;
