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

export interface RegistroOperatividad extends CrearRegistroInput {
  id_registro: number;
}

export async function crearRegistroOperatividad(
  input: CrearRegistroInput,
): Promise<RegistroOperatividad> {
  return apiClient.post<RegistroOperatividad>('/registros-operatividad', input);
}
