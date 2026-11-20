import { api } from './api';
import { LoginResponse, UsuarioSesion } from '../types/auth';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

// Recupera el usuario de la sesión a partir del token guardado.
// Timeout largo: el servidor en Render puede tardar en "despertar".
export async function obtenerPerfil(): Promise<UsuarioSesion> {
  const { data } = await api.get<UsuarioSesion>('/auth/me', { timeout: 30000 });
  return data;
}
