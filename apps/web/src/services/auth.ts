/**
 * Servicio de autenticación — CONECTADO al backend real de Carlo.
 *
 * Nota sobre roles: el backend hoy solo tiene 3 roles sembrados
 * ('administrador', 'bombero', 'capitan'), no los 4 que habíamos asumido
 * ('mecanico', 'comandancia' incluidos). Falta que el equipo confirme el
 * modelo final de roles — mientras tanto, el tipo Rol refleja lo que
 * REALMENTE existe hoy en la base de datos.
 */

export type Rol = 'administrador' | 'bombero' | 'capitan';

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
