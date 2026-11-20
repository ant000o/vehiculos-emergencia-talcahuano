import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehiculosPage } from './pages/vehiculos/VehiculosPage';
import { MantencionesPage } from './pages/mantenciones/MantencionesPage';
import { InventarioPage } from './pages/inventario/InventarioPage';
import { HistorialEstadosPage } from './pages/historial-estados/HistorialEstadosPage';
import { HistorialCambiosPage } from './pages/historial-cambios/HistorialCambiosPage';
import { GrifosPage } from './pages/grifos/GrifosPage';
import { CentralMapaPage } from './pages/mapa/CentralMapaPage';
import { PermisosPage } from './pages/permisos/PermisosPage';
import { UsuariosPage } from './pages/usuarios/UsuariosPage';
import { DespachosPage } from './pages/despachos/DespachosPage';
import { InicioPage } from './pages/InicioPage';

export function App() {
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
            <Route
              index
              element={
                <ProtectedRoute modulo="inicio">
                  <InicioPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="dashboard"
              element={
                <ProtectedRoute modulo="dashboard">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Despachos de Emergencia */}
            <Route
              path="despachos"
              element={
                <ProtectedRoute modulo="despachos">
                  <DespachosPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="vehiculos"
              element={
                <ProtectedRoute modulo="vehiculos">
                  <VehiculosPage />
                </ProtectedRoute>
              }
            />
            
            {/* Historial de Estados (incluye registro de estado integrado) */}
            <Route
              path="historial-estados"
              element={
                <ProtectedRoute modulo="operatividad">
                  <HistorialEstadosPage />
                </ProtectedRoute>
              }
            />

            {/* Historial de Cambios (Auditoría V2) */}
            <Route
              path="historial-cambios"
              element={
                <ProtectedRoute permiso="auditoria.ver">
                  <HistorialCambiosPage />
                </ProtectedRoute>
              }
            />

            {/* Redirección para compatibilidad si alguien accede a /registrar-estado */}
            <Route path="registrar-estado" element={<Navigate to="/historial-estados" replace />} />

            <Route
              path="mantenciones"
              element={
                <ProtectedRoute modulo="mantenciones">
                  <MantencionesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="inventario"
              element={
                <ProtectedRoute modulo="inventario">
                  <InventarioPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="grifos"
              element={
                <ProtectedRoute modulo="grifos">
                  <GrifosPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="mapa"
              element={
                <ProtectedRoute modulo="mapa">
                  <CentralMapaPage />
                </ProtectedRoute>
              }
            />

            {/* Permisos: Panel exclusivo de Administrador */}
            <Route
              path="permisos"
              element={
                <ProtectedRoute roles={['administrador']}>
                  <PermisosPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="usuarios"
              element={
                <ProtectedRoute modulo="usuarios">
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
