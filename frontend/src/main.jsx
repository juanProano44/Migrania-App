import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import './common/styles/normalize.css'
import "./common/styles/index.css"

import Login from './pages/Login.jsx'

// Feature Grupo 7 - Generación y Seguimiento de Tratamiento
import PrimerConsulta from "./features/feature_Grupo7_GeneracionSeguimientoTratamiento/pages/PrimerConsulta.jsx";
import Seguimiento from "./features/feature_Grupo7_GeneracionSeguimientoTratamiento/pages/Seguimiento.jsx";
import CrearTratamiento from "./features/feature_Grupo7_GeneracionSeguimientoTratamiento/pages/CrearTratamiento.jsx";
import Tratamientos from "./features/feature_Grupo7_GeneracionSeguimientoTratamiento/pages/Tratamientos.jsx";
import SuspenderTratamiento from "./features/feature_Grupo7_GeneracionSeguimientoTratamiento/pages/SuspenderTratamiento.jsx";
import EditarTratamiento from "./features/feature_Grupo7_GeneracionSeguimientoTratamiento/pages/EditarTratamiento.jsx";
import HistorialTratamientos from "./features/feature_Grupo7_GeneracionSeguimientoTratamiento/pages/HistorialTratamientos.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* Feature Grupo 7 - Rutas para Generación y Seguimiento de Tratamiento */}
        <Route path="/primerConsulta" element={<PrimerConsulta />}/>
        <Route path="/primerConsulta/crearTratamiento" element={<CrearTratamiento />}/>
        <Route path="/seguimiento" element={<Seguimiento />}/>
        <Route path="/seguimiento/crearTratamiento" element={<CrearTratamiento />}/>
        <Route path="/seguimiento/tratamientos" element={<Tratamientos />}/>
        <Route path="/seguimiento/tratamientos/crearTratamiento" element={<CrearTratamiento />}/>
        <Route path="/seguimiento/tratamientos/crearTratamiento/suspenderTratamiento" element={<SuspenderTratamiento />}/>
        <Route path="/seguimiento/tratamientos/crearTratamiento/editarTratamiento" element={<EditarTratamiento />}/>
        <Route path="/seguimiento/tratamientos/editar/:tratamientoId" element={<EditarTratamiento />}/>
        <Route path="/historialTratamientos" element={<HistorialTratamientos />}/>
      </Routes>
    </Router>
  </StrictMode>,
)
