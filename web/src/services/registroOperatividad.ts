/**
 * Servicio de registro de operatividad diaria (HU-05) — conectado al backend real.
 */

import { apiClient } from './apiClient';

export interface CrearRegistroInput {
  fecha_hora_registro: string;
  nivel_combustible?: number;
  nivel_agua?: number;
  nivel_aceite?: number;
  observaciones?: string;
  id_usuario: number;
  id_vehiculo: number;
}

export interface ActualizarRegistroInput {
  nivel_combustible?: number;
  nivel_agua?: number;
  nivel_aceite?: number;
  observaciones?: string;
}

export interface RegistroOperatividad {
  id_registro: number;
  fecha_hora_registro: string;
  nivel_combustible: number | string | null;
  nivel_agua: number | string | null;
  nivel_aceite: number | string | null;
  observaciones: string | null;
  id_usuario: number;
  id_vehiculo: number;
  usuario?: { id_usuario: number; nombre: string; apellidos: string };
  vehiculo?: { id_vehiculo: number; patente: string };
}

export async function listarRegistros(): Promise<RegistroOperatividad[]> {
  return apiClient.get<RegistroOperatividad[]>('/registros-operatividad');
}

export async function crearRegistroOperatividad(
  input: CrearRegistroInput,
): Promise<RegistroOperatividad> {
  return apiClient.post<RegistroOperatividad>('/registros-operatividad', input);
}

export async function actualizarRegistroOperatividad(
  id: number,
  input: ActualizarRegistroInput,
): Promise<RegistroOperatividad> {
  return apiClient.patch<RegistroOperatividad>(`/registros-operatividad/${id}`, input);
}

// --- HU-06: historial de estados ---
export interface UsuarioResumen {
  id_usuario: number;
  nombre: string;
  apellidos: string;
}

export interface RegistroOperatividadDetalle {
  id_registro: number;
  fecha_hora_registro: string;
  nivel_combustible: number | null;
  nivel_agua: number | null;
  nivel_aceite: number | null;
  observaciones: string | null;
  id_vehiculo: number;
  usuario: UsuarioResumen;
}

export async function listarRegistrosOperatividad(): Promise<RegistroOperatividadDetalle[]> {
  return apiClient.get<RegistroOperatividadDetalle[]>('/registros-operatividad');
}