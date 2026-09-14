/**
 * Servicio de autenticación — CONECTADO al backend real de Carlo.
 *
 * Roles reales confirmados en la BD: administrador, bombero, capitan, mecanico.
 * 'capitan' es el nombre en BD para lo que las HU llaman "Comandancia /
 * Oficial a Cargo" — confirmar con Carlo que esa equivalencia es correcta.
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

const API_URL = import.meta.env.VITE_API_URL;

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    // El backend responde 401 con { message, statusCode, error } en credenciales inválidas.
    const cuerpo = await response.json().catch(() => null);
    throw new Error(cuerpo?.message ?? 'No se pudo iniciar sesión.');
  }

  const data = await response.json();

  // El backend devuelve rol y compañía como TEXTO (no como IDs numéricos),
  // a diferencia de lo que asumíamos en el mock.
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

export function logout(): void {
  localStorage.removeItem('accessToken');
}
