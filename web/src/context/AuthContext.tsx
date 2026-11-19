import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  login as loginService,
  logout as logoutService,
  obtenerUsuarioActual,
  type AuthUser,
  type LoginCredentials,
} from '../services/auth';
import { AuthContext, type ScopeType } from './auth-context';

const LEGACY_ALIASES: Record<string, string[]> = {
  'vehiculos.view': [],
  'vehiculos.create': ['vehiculo.gestionar'],
  'vehiculos.update': ['vehiculo.gestionar'],
  'vehiculos.delete': ['vehiculo.gestionar'],
  'usuarios.view': ['personal.ver'],
  'usuarios.create': ['personal.gestionar'],
  'usuarios.update': ['personal.gestionar'],
  'usuarios.delete': ['personal.gestionar'],
  'despachos.view': ['despacho.ver'],
  'despachos.create': ['despacho.gestionar'],
  'despachos.update': ['despacho.gestionar'],
  'despachos.delete': ['despacho.gestionar'],
  'grifos.view': [],
  'grifos.create': ['operatividad.editar'],
  'grifos.update': ['operatividad.editar'],
  'grifos.delete': ['operatividad.editar'],
  'inventario.view': ['inventario.ver'],
  'inventario.create': ['inventario.gestionar'],
  'inventario.update': ['inventario.gestionar'],
  'inventario.delete': ['inventario.gestionar'],
  'mantenciones.view': ['mantencion.ver', 'mantencion.historial'],
  'mantenciones.create': ['mantencion.crear'],
  'mantenciones.update': ['mantencion.editar'],
  'mantenciones.delete': ['mantencion.editar'],
  'operatividad.view': ['operatividad.ver'],
  'operatividad.create': ['operatividad.crear', 'operatividad.registrar'],
  'operatividad.update': ['operatividad.editar'],
  'operatividad.delete': ['operatividad.editar'],
  'dashboard.view': ['dashboard.general', 'dashboard.compania'],
  'mapa.view': ['despacho.ver'],
  'mapa.create': ['despacho.gestionar'],
  'mapa.update': ['despacho.gestionar'],
  'mapa.delete': ['despacho.gestionar'],
};

function normalizarUsuario(u: any): AuthUser {
  const rawRol = (typeof u.rol === 'object' && u.rol !== null
    ? u.rol.nombre_rol
    : u.rol) || '';
  const rolPlano = typeof rawRol === 'string' ? rawRol.toLowerCase().trim() : '';

  return {
    ...u,
    id: u.id ?? u.id_usuario,
    rol: rolPlano,
    id_rol: u.id_rol,
    id_compania: u.id_compania,
    compania: u.compania || '',
    permisos: Array.isArray(u.permisos) ? u.permisos : [],
    alcances: u.alcances || {},
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const cachedUser = localStorage.getItem('authUser');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        return parsed ? normalizarUsuario(parsed) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refrescarSesion = useCallback(async () => {
    try {
      const u = await obtenerUsuarioActual();
      if (u) {
        const normalizado = normalizarUsuario(u);
        setUser(normalizado);
        localStorage.setItem('authUser', JSON.stringify(normalizado));
      } else {
        setUser(null);
        localStorage.removeItem('authUser');
      }
    } catch {
      // Ignorar errores en refresh pasivo
    }
  }, []);

  useEffect(() => {
    refrescarSesion().finally(() => {
      setIsLoading(false);
    });
  }, [refrescarSesion]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginService(credentials);
      const userNormalizado = normalizarUsuario(response.user);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('authUser', JSON.stringify(userNormalizado));
      setUser(userNormalizado);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutService();
    localStorage.removeItem('authUser');
    setUser(null);
  }, []);

  const MODULO_SCOPE_ALIASES: Record<string, string[]> = {
    vehiculos: ['vehiculo'],
    mantenciones: ['mantencion'],
    usuarios: ['personal'],
    despachos: ['despacho'],
    mapa: ['despacho'],
    operatividad: ['historial_estados', 'operatividad'],
    dashboard: ['reportes', 'dashboard'],
  };

  const getScope = useCallback(
    (modulo: string): ScopeType => {
      if (!user) return 'NONE';
      const rolLower = (user.rol || '').toLowerCase().trim();
      if (rolLower === 'administrador') return 'GLOBAL';
      const modKey = modulo.toLowerCase().trim();

      const clavesABuscar = [modKey, ...(MODULO_SCOPE_ALIASES[modKey] || [])];
      for (const clave of clavesABuscar) {
        const scope = user.alcances?.[clave];
        if (scope) return scope as ScopeType;
      }

      return 'COMPANY';
    },
    [user],
  );

  const hasPermission = useCallback(
    (modulo: string, accion: 'view' | 'create' | 'update' | 'delete' | string = 'view'): boolean => {
      if (!user) return false;
      const rolLower = (user.rol || '').toLowerCase().trim();
      // Regla centralizada: Administrador tiene acceso total
      if (rolLower === 'administrador') return true;

      const modKey = modulo.toLowerCase().trim();
      const accKey = accion.toLowerCase().trim();
      const codigo = `${modKey}.${accKey}`;

      // Si el alcance configurado para este módulo es NONE, denegado
      if (getScope(modKey) === 'NONE') return false;

      // Verificar código normalizado
      if (user.permisos && user.permisos.includes(codigo)) {
        return true;
      }

      // Solo usar aliases legacy si el rol aún no migra a permisos modernos (*.view)
      const usaMatrizModerna = user.permisos?.some((p) => p.endsWith('.view'));
      if (!usaMatrizModerna) {
        const legacyCodes = LEGACY_ALIASES[codigo];
        if (legacyCodes && user.permisos) {
          if (legacyCodes.some((lc) => user.permisos.includes(lc))) {
            return true;
          }
        }
      }

      return false;
    },
    [user, getScope],
  );

  const tienePermiso = useCallback(
    (codigo: string): boolean => {
      if (!user) return false;
      const rolLower = (user.rol || '').toLowerCase().trim();
      if (rolLower === 'administrador') return true;
      if (!user.permisos || user.permisos.length === 0) return false;

      if (user.permisos.includes(codigo)) return true;

      // Si el código viene como formato modulo.accion
      if (codigo.includes('.')) {
        const [mod, acc] = codigo.split('.');
        return hasPermission(mod, acc);
      }
      return false;
    },
    [user, hasPermission],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        error,
        login,
        logout,
        tienePermiso,
        hasPermission,
        getScope,
        refrescarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
