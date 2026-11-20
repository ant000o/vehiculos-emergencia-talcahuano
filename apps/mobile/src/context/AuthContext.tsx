import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getToken, saveToken, clearToken } from '../services/api';
import { login as loginRequest, obtenerPerfil } from '../services/auth.service';
import { UsuarioSesion } from '../types/auth';

const USUARIO_KEY = 'sigev_usuario';

interface AuthContextValue {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function leerUsuarioGuardado(): Promise<UsuarioSesion | null> {
  try {
    const raw = await SecureStore.getItemAsync(USUARIO_KEY);
    return raw ? (JSON.parse(raw) as UsuarioSesion) : null;
  } catch {
    return null;
  }
}

async function guardarUsuario(u: UsuarioSesion) {
  try {
    await SecureStore.setItemAsync(USUARIO_KEY, JSON.stringify(u));
  } catch {
    // Si no se puede guardar, la sesión igual funciona; solo no queda en caché.
  }
}

async function borrarUsuario() {
  try {
    await SecureStore.deleteItemAsync(USUARIO_KEY);
  } catch {
    // nada
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la app: si hay token, se recupera la sesión.
  //  1) Se muestra de inmediato el usuario guardado (abre rápido, aunque el
  //     servidor esté "dormido" o no haya señal).
  //  2) En segundo plano se valida el token con GET /auth/me y se refrescan
  //     rol y permisos. Solo se cierra la sesión si el servidor responde 401.
  useEffect(() => {
    let cancelado = false;

    async function restaurarSesion() {
      const token = await getToken();
      if (!token) {
        if (!cancelado) setCargando(false);
        return;
      }

      const guardado = await leerUsuarioGuardado();
      if (guardado && !cancelado) {
        setUsuario(guardado);
        setCargando(false);
      }

      for (let intento = 0; intento < 3 && !cancelado; intento++) {
        try {
          const fresco = await obtenerPerfil();
          if (cancelado) return;
          setUsuario(fresco);
          await guardarUsuario(fresco);
          setCargando(false);
          return;
        } catch (err: any) {
          if (err?.response?.status === 401) {
            await clearToken();
            await borrarUsuario();
            if (!cancelado) {
              setUsuario(null);
              setCargando(false);
            }
            return;
          }
          // Error de red / servidor despertando: se reintenta.
        }
      }

      // No se pudo validar: si había usuario guardado se mantiene la sesión;
      // si no, se pide login.
      if (!cancelado) setCargando(false);
    }

    restaurarSesion();
    return () => {
      cancelado = true;
    };
  }, []);

  async function login(email: string, password: string) {
    const data = await loginRequest(email, password);
    await saveToken(data.access_token);
    await guardarUsuario(data.usuario);
    setUsuario(data.usuario);
  }

  async function logout() {
    await clearToken();
    await borrarUsuario();
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
