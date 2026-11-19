/**
 * Servicio de autenticación — CONECTADO al backend real.
 * Roles reales confirmados en la BD: administrador, bombero, capitan, mecanico, central, comandante, director.
 */

import { disconnectSocket } from './socket';

export type Rol = 'administrador' | 'bombero' | 'capitan' | 'mecanico' | 'central' | 'comandante' | 'director' | string;

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
  id_rol?: number;
  id_compania?: number;
  compania: string;
  permisos: string[];
  alcances?: Record<string, 'GLOBAL' | 'COMPANY' | 'PARTICIPATION' | 'NONE'>;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function extraerNombreRol(rolRaw: any): string {
  if (!rolRaw) return '';
  if (typeof rolRaw === 'object' && rolRaw.nombre_rol) {
    return String(rolRaw.nombre_rol).toLowerCase().trim();
  }
  return String(rolRaw).toLowerCase().trim();
}

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
  const rolPlano = extraerNombreRol(data.usuario?.rol);

  const user: AuthUser = {
    id: data.usuario.id_usuario,
    nombre: data.usuario.nombre,
    apellidos: data.usuario.apellidos,
    email: data.usuario.email,
    rol: rolPlano,
    id_rol: data.usuario.id_rol,
    id_compania: data.usuario.id_compania,
    compania: data.usuario.compania || '',
    permisos: Array.isArray(data.usuario.permisos) ? data.usuario.permisos : [],
    alcances: data.usuario.alcances && typeof data.usuario.alcances === 'object' ? data.usuario.alcances : {},
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
    const rolPlano = extraerNombreRol(data.rol);
    return {
      id: data.id_usuario,
      nombre: data.nombre,
      apellidos: data.apellidos,
      email: data.email,
      rol: rolPlano,
      id_rol: data.id_rol,
      id_compania: data.id_compania,
      compania: data.compania || '',
      permisos: Array.isArray(data.permisos) ? data.permisos : [],
      alcances: data.alcances && typeof data.alcances === 'object' ? data.alcances : {},
    };
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem('accessToken');
  disconnectSocket();
}