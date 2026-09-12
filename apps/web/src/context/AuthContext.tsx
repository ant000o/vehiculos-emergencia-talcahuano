import { useState, useCallback, type ReactNode } from 'react';
import {
  login as loginService,
  logout as logoutService,
  type AuthUser,
  type LoginCredentials,
} from '../services/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginService(credentials);
      localStorage.setItem('accessToken', response.accessToken);
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
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
