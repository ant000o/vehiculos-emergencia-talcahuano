import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/useAuth';
import type { Rol } from '../services/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Módulo al que pertenece la ruta en el nuevo estándar RBAC */
  modulo?: string;
  /** Acción requerida (por defecto 'view') */
  accion?: string;
  /** Código o lista de códigos de permiso en la matriz RBAC de la BD (compatibilidad) */
  permiso?: string | string[];
  /** Si se especifica, roles que pueden acceder de forma complementaria */
  roles?: Rol[];
}

export function ProtectedRoute({ children, modulo, accion = 'view', permiso, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasPermission, tienePermiso } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'var(--font-body)', color: 'var(--color-ink-500)' }}>
        Cargando sesión...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user) {
    const userRolLower = (user.rol || '').toLowerCase().trim();
    const esAdmin = userRolLower === 'administrador';

    // Regla de Superadministrador universal
    if (esAdmin) {
      return <>{children}</>;
    }

    // 1. Verificación centralizada por Módulo y Acción
    if (modulo) {
      if (hasPermission(modulo, accion)) {
        return <>{children}</>;
      }
      return <Navigate to="/" replace />;
    }

    // 2. Verificación por código específico (compatibilidad)
    if (permiso) {
      const tieneAcceso = Array.isArray(permiso)
        ? permiso.some((p) => tienePermiso(p))
        : tienePermiso(permiso);

      if (tieneAcceso) {
        return <>{children}</>;
      }
      return <Navigate to="/" replace />;
    }

    // 3. Fallback por roles
    if (roles && roles.length > 0) {
      if (roles.some((r) => r.toLowerCase().trim() === userRolLower)) {
        return <>{children}</>;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
