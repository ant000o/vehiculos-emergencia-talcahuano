/**
 * Servicio de autenticación — CONECTADO al backend real.
 * Roles reales confirmados en la BD: administrador, bombero, capitan, mecanico.
 */

export type Rol = 'administrador' | 'bombero' | 'capitan' | 'mecanico';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: Rol;
  compania: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null);
    throw new Error(cuerpo?.message ?? 'No se pudo iniciar sesión.');
  }

  const data = await response.json();

  const user: AuthUser = {
    id: data.usuario.id_usuario,
    nombre: data.usuario.nombre,
    apellidos: data.usuario.apellidos,
    email: data.usuario.email,
    rol: data.usuario.rol,
    compania: data.usuario.compania,
  };

  return { user, accessToken: data.access_token };
}

export async function obtenerUsuarioActual(): Promise<AuthUser | null> {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      localStorage.removeItem('accessToken');
      return null;
    }

    const data = await response.json();
    return {
      id: data.id_usuario,
      nombre: data.nombre,
      apellidos: data.apellidos,
      email: data.email,
      rol: data.rol,
      compania: data.compania,
    };
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem('accessToken');
}
