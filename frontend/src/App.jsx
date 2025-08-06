import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardMedico from './pages/medico/DashboardMedico';
import GenerarTratamiento from './pages/medico/GenerarTratamiento';
import SeguimientoTratamiento from './pages/medico/SeguimientoTratamiento';
import Tratamientos from './features/feature_Grupo7_GeneracionSeguimientoTratamiento/pages/Tratamientos';
import Seguimiento from './features/feature_Grupo7_GeneracionSeguimientoTratamiento/pages/Seguimiento';
import EditarTratamiento from './features/feature_Grupo7_GeneracionSeguimientoTratamiento/pages/EditarTratamiento';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta por defecto redirige al login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Rutas de autenticación */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas del médico */}
          <Route path="/medico/dashboard" element={<DashboardMedico />} />
          <Route path="/medico/tratamiento/generar/:pacienteId" element={<GenerarTratamiento />} />
          <Route path="/medico/tratamiento/seguimiento/:pacienteId" element={<SeguimientoTratamiento />} />
          
          {/* Rutas de seguimiento */}
          <Route path="/seguimiento/tratamientos" element={<Tratamientos />} />
          <Route path="/seguimiento/:pacienteId" element={<Seguimiento />} />
          <Route path="/seguimiento/tratamientos/editar/:tratamientoId" element={<EditarTratamiento />} />
          
          {/* Ruta para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
