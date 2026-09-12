import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsuariosPage } from './pages/usuarios/UsuariosPage';
import { VehiculosPage } from './pages/vehiculos/VehiculosPage';
import { ComingSoonPage } from './pages/placeholder/ComingSoonPage';

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
            <Route path="mantenciones" element={<ComingSoonPage title="Mantenciones" />} />
            <Route path="grifos" element={<ComingSoonPage title="Grifos" />} />
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
