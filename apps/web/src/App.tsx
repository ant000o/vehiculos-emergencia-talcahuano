import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsuariosPage } from './pages/usuarios/UsuariosPage';
import { VehiculosPage } from './pages/vehiculos/VehiculosPage';
import { CentralMapaPage } from './pages/mapa/CentralMapaPage';
import { HistorialEstadosPage } from './pages/historial-estados/HistorialEstadosPage';
import { MantencionesPage } from './pages/mantenciones/MantencionesPage';
import { GrifosPage } from './pages/grifos/GrifosPage';
import { InventarioPage } from './pages/inventario/InventarioPage';
import { DespachosPage } from './pages/despachos/DespachosPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            {/* HU-28: solo la interfaz; falta reforzar esto también en el backend (despacho_emergencia.controller.ts no tiene @Roles). */}
            <Route
              path="despachos"
              element={
                <ProtectedRoute roles={['administrador', 'bombero', 'capitan']}>
                  <DespachosPage />
                </ProtectedRoute>
              }
            />
            <Route path="vehiculos" element={<VehiculosPage />} />
            
            {/* Historial de Estados (incluye registro de estado integrado) */}
            <Route
              path="historial-estados"
              element={
                <ProtectedRoute roles={['administrador', 'mecanico', 'bombero', 'capitan']}>
                  <HistorialEstadosPage />
                </ProtectedRoute>
              }
            />
            {/* Redirección para compatibilidad si alguien accede a /registrar-estado */}
            <Route path="registrar-estado" element={<Navigate to="/historial-estados" replace />} />

            <Route
              path="mantenciones"
              element={
                <ProtectedRoute roles={['administrador', 'mecanico', 'capitan']}>
                  <MantencionesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="inventario"
              element={
                <ProtectedRoute roles={['administrador', 'mecanico', 'capitan']}>
                  <InventarioPage />
                </ProtectedRoute>
              }
            />

            <Route path="grifos" element={<GrifosPage />} />

            <Route
              path="mapa"
              element={
                <ProtectedRoute roles={['administrador', 'capitan']}>
                  <CentralMapaPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="usuarios"
              element={
                <ProtectedRoute roles={['administrador']}>
                  <UsuariosPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
