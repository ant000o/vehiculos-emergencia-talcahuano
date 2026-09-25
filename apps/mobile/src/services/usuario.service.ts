import { api } from './api';
import { Usuario } from '../types/auth';

export interface CreateUsuarioPayload {
  rut: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  id_rol: number;
  id_compania: number;
  estado_activo?: boolean;
}

// El backend no acepta 'password' en edición (ver UpdateUsuarioDto: OmitType(['password'])).
export type UpdateUsuarioPayload = Partial<Omit<CreateUsuarioPayload, 'password'>>;

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>('/usuarios');
  return data;
}

export async function obtenerUsuario(id: number): Promise<Usuario> {
  const { data } = await api.get<Usuario>(`/usuarios/${id}`);
  return data;
}

export async function crearUsuario(payload: CreateUsuarioPayload): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/usuarios', payload);
  return data;
}

export async function editarUsuario(id: number, payload: UpdateUsuarioPayload): Promise<Usuario> {
  const { data } = await api.patch<Usuario>(`/usuarios/${id}`, payload);
  return data;
}

export async function eliminarUsuario(id: number): Promise<void> {
  await api.delete(`/usuarios/${id}`);
}