/**
 * Servicio de registro de operatividad diaria (HU-05) — conectado al backend real.
 *
 * ⚠️ Diferencia con lo que describe la HU: el backend NO tiene un "checklist
 * booleano" — usa 3 niveles numéricos (0-100: combustible, agua, aceite).
 * Tampoco cambia automáticamente el estado del vehículo al recibir un
 * registro (el service de Carlo solo guarda el registro, sin lógica extra).
 * Ambas cosas quedan reportadas al equipo; no es algo que se arregle acá.
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

export interface RegistroOperatividad {
  id_registro: number;
  fecha_hora_registro: string;
  // 'numeric' en Postgres puede llegar como string vía el driver (igual que
  // el bigint de kilometraje) — se trata como tal al mostrarlo.
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

// --- HU-06: historial de estados ---
// ⚠️ El backend no filtra por vehículo, no ordena por fecha, ni pagina.
// Se hace todo del lado del frontend por ahora — funciona bien mientras el
// volumen de datos sea chico, pero conviene mover esto al backend
// (query params ?id_vehiculo=&page=&limit=) cuando haya más registros.

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
