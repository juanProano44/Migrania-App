import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/seguimiento.css";
import ConfirmacionCancelar from "@/features/feature_Grupo7_GeneracionSeguimientoTratamiento/components/ConfirmacionCancelar.jsx";

function Seguimiento() {
    const navigate = useNavigate();
    const { pacienteId } = useParams(); // Obtener pacienteId de la URL
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [doctorName, setDoctorName] = useState("");
    const [patientName, setPatientName] = useState("Paciente X");
    const [episodeData, setEpisodeData] = useState([]);
    const [tratamientos, setTratamientos] = useState([]);
    const [loadingTratamientos, setLoadingTratamientos] = useState(false);

    useEffect(() => {
        setDoctorName("Dr. X");
        setPatientName("Juan Pérez");
        setEpisodeData([
            { num: 1, tipo: "Migraña", fecha: "10/08/2025", tratamiento: "Activo" },
            { num: 2, tipo: "Cefalea tensional", fecha: "12/08/2025", tratamiento: "S/T" },
        ]);
        
        // Cargar tratamientos al iniciar
        cargarTratamientos();
    }, []);

    const cargarTratamientos = async () => {
        setLoadingTratamientos(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('access');
            if (!token) {
                console.log('No hay token disponible');
                return;
            }

            const response = await fetch('http://127.0.0.1:8000/api/tratamientos/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTratamientos(data.results || data || []);
                console.log('Tratamientos cargados:', data);
            } else {
                console.error('Error al cargar tratamientos:', response.status);
            }
        } catch (error) {
            console.error('Error de conexión:', error);
        } finally {
            setLoadingTratamientos(false);
        }
    };

    const handleCancel = () => setIsModalVisible(true);
    const handleCloseModal = () => setIsModalVisible(false);

    const handleNavigateHistorial = () => navigate(`/bitacora-medico/${pacienteId || '3'}`);
    const handleNavigateCrearTratamiento = () => navigate("/seguimiento/crearTratamiento");
    const handleNavigateTratamientos = () => {
        // Navegar a la ruta que ya funciona
        navigate("/seguimiento/tratamientos");
    };

    return (
        <div className="seguimiento">
            <header>
                <div className="user-info">
                    <span className="user-icon">👤</span>
                    <span className="user-name">{doctorName}</span>
                </div>
            </header>

            <div className="seguimiento__patient-info">
                <h1>{patientName} - Seguimiento</h1>
                <button className="seguimiento__history-button" onClick={handleNavigateHistorial}>Historial</button>
                <button className="seguimiento__tratamiento-button" onClick={handleNavigateTratamientos}>Tratamiento</button>
            </div>

            <div className="seguimiento__table-container">
                <table>
                    <thead>
                    <tr>
                        <th>Num. Episodio</th>
                        <th>Tipo Episodio</th>
                        <th>Fecha</th>
                        <th>Tratamiento</th>
                    </tr>
                    </thead>
                    <tbody>
                    {episodeData.map((episode) => (
                        <tr key={episode.num}>
                            <td>{episode.num}</td>
                            <td>{episode.tipo}</td>
                            <td>{episode.fecha}</td>
                            <td>{episode.tratamiento}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Nueva sección para mostrar tratamientos guardados */}
            {/* <div className="seguimiento__tratamientos-guardados">
                <h2>📋 Tratamientos Guardados en Base de Datos</h2>
                <button onClick={cargarTratamientos}>
                    🔄 Actualizar Lista
                </button>
                
                {loadingTratamientos ? (
                    <p>Cargando tratamientos...</p>
                ) : tratamientos.length === 0 ? (
                    <p style={{color: 'orange'}}>⚠️ No hay tratamientos guardados aún.</p>
                ) : (
                    <div>
                        <p style={{color: 'green'}}>✅ Total de tratamientos: {tratamientos.length}</p>
                        {tratamientos.map((tratamiento, index) => (
                            <div key={index} className="tratamiento-item">
                                <p><strong>ID:</strong> {tratamiento.id}</p>
                                <p><strong>Fecha:</strong> {tratamiento.fecha_inicio}</p>
                                <p><strong>Activo:</strong> {tratamiento.activo ? 'Sí' : 'No'}</p>
                                <p><strong>Observaciones:</strong> {tratamiento.observaciones}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div> */}

            <div className="seguimiento__actions">
                <button className="seguimiento__create-treatment" onClick={handleNavigateCrearTratamiento}>Crear tratamiento</button>
                <button className="seguimiento__cancel" onClick={handleCancel}>Cancelar</button>
            </div>

            {isModalVisible && <ConfirmacionCancelar onClose={handleCloseModal} />}
        </div>
    );
}

export default Seguimiento;