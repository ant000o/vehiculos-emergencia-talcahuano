import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsuariosPage } from './pages/usuarios/UsuariosPage';
import { VehiculosPage } from './pages/vehiculos/VehiculosPage';
import { RegistrarEstadoPage } from './pages/registro-operatividad/RegistrarEstadoPage';
import { HistorialEstadosPage } from './pages/historial-estados/HistorialEstadosPage';
import { MantencionesPage } from './pages/mantenciones/MantencionesPage';
import { MarcarEstadoGrifoPage } from './pages/grifos/MarcarEstadoGrifoPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Todo lo de acá abajo comparte el mismo AppLayout (sidebar +
              topbar). ProtectedRoute exige sesión iniciada antes de mostrar
              cualquiera de estas rutas. */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="vehiculos" element={<VehiculosPage />} />
            <Route
              path="registrar-estado"
              element={
                <ProtectedRoute roles={['bombero']}>
                  <RegistrarEstadoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="historial-estados"
              element={
                <ProtectedRoute roles={['mecanico']}>
                  <HistorialEstadosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="mantenciones"
              element={
                <ProtectedRoute roles={['mecanico']}>
                  <MantencionesPage />
                </ProtectedRoute>
              }
            />
            <Route path="grifos" element={<MarcarEstadoGrifoPage />} />
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
