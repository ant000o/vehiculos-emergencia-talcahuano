import { createContext } from 'react';
import type { AuthUser, LoginCredentials } from '../services/auth';

export type ScopeType = 'GLOBAL' | 'COMPANY' | 'PARTICIPATION' | 'NONE';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  tienePermiso: (codigo: string) => boolean;
  hasPermission: (modulo: string, accion?: 'view' | 'create' | 'update' | 'delete' | string) => boolean;
  getScope: (modulo: string) => ScopeType;
  refrescarSesion: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
