import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  login as loginService,
  logout as logoutService,
  obtenerUsuarioActual,
  type AuthUser,
  type LoginCredentials,
} from '../services/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Restaurar usuario desde localStorage para renderizado inmediato
    const cachedUser = localStorage.getItem('authUser');
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Al montar o refrescar (F5), verificar sesión contra el backend
    obtenerUsuarioActual()
      .then((u) => {
        if (u) {
          setUser(u);
          localStorage.setItem('authUser', JSON.stringify(u));
        } else {
          setUser(null);
          localStorage.removeItem('authUser');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginService(credentials);
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('authUser', JSON.stringify(response.user));
      setUser(response.user);
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

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
