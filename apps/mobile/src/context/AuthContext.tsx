import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, saveToken, clearToken } from '../services/api';
import { login as loginRequest } from '../services/auth.service';
import { LoginResponse } from '../types/auth';

type UsuarioSesion = LoginResponse['usuario'];

interface AuthContextValue {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la app, revisa si ya había un token guardado de una sesión anterior.
  useEffect(() => {
    async function restaurarSesion() {
      const token = await getToken();
      // Nota: por ahora solo verificamos que exista el token.
      // El backend igual lo valida en cada request (JwtAuthGuard),
      // así que un token vencido simplemente fallará en la primera
      // llamada protegida y ahí se puede forzar logout.
      if (token) {
        // TODO: si más adelante se agrega GET /auth/me, usarlo aquí
        // para recuperar los datos del usuario, no solo saber que hay token.
      }
      setCargando(false);
    }
    restaurarSesion();
  }, []);

  async function login(email: string, password: string) {
    const data = await loginRequest(email, password);
    await saveToken(data.access_token);
    setUsuario(data.usuario);
  }

  async function logout() {
    await clearToken();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}