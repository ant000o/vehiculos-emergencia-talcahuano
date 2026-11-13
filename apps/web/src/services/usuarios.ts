/**
 * Servicio de gestión de usuarios (HU-02) — CONECTADO al backend real.
 * Los nombres de campo siguen exactamente los DTO de Carlo.
 */

import { apiClient } from './apiClient';

export interface RolOption {
  id_rol: number;
  nombre_rol: string;
}

export interface CompaniaOption {
  id_compania: number;
  nombre: string;
}

export interface Usuario {
  id_usuario: number;
  rut: string;
  nombre: string;
  apellidos: string;
  email: string;
  id_rol: number;
  // El backend ya manda esta relación en GET /usuarios (findAll carga
  // { rol: true }); la tipamos para no tener que adivinar el rol por
  // id_rol fijo (F5 — frágil si cambia el orden del seed o se agrega
  // un rol nuevo, como "Central").
  rol?: RolOption;
  id_compania: number;
  estado_activo: boolean;
}

export interface CrearUsuarioInput {
  rut: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  id_rol: number;
  id_compania: number;
}

export type EditarUsuarioInput = Omit<CrearUsuarioInput, 'password'>;

export async function listarRoles(): Promise<RolOption[]> {
  return apiClient.get<RolOption[]>('/roles');
}

export async function listarCompanias(): Promise<CompaniaOption[]> {
  return apiClient.get<CompaniaOption[]>('/companias');
}

export async function listarUsuarios(): Promise<Usuario[]> {
  return apiClient.get<Usuario[]>('/usuarios');
}

export async function crearUsuario(input: CrearUsuarioInput): Promise<Usuario> {
  return apiClient.post<Usuario>('/usuarios', input);
}

export async function editarUsuario(
  id_usuario: number,
  input: EditarUsuarioInput,
): Promise<Usuario> {
  return apiClient.patch<Usuario>(`/usuarios/${id_usuario}`, input);
}

export async function cambiarEstadoUsuario(
  id_usuario: number,
  estado_activo: boolean,
): Promise<Usuario> {
  return apiClient.patch<Usuario>(`/usuarios/${id_usuario}`, { estado_activo });
}
