/**
 * Servicio de grifos (HU-11) — conectado al backend real.
 * Las coordenadas se guardan como GeoJSON Point: { type: 'Point', coordinates: [lng, lat] }.
 * OJO al orden: GeoJSON es [longitud, latitud], al revés de como uno suele pensarlo.
 */

import { apiClient } from './apiClient';

export type EstadoGrifo = 'operativo' | 'en_mantencion' | 'fuera_de_servicio';

export interface PuntoGeografico {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface Grifo {
  id_grifo: number;
  coordenadas: PuntoGeografico;
  direccion: string | null;
  estado_operativo: EstadoGrifo;
  ultima_revision: string | null;
  id_compania: number;
  compania?: { id_compania: number; nombre: string };
}

export interface ActualizarEstadoGrifoInput {
  coordenadas: PuntoGeografico;
  estado_operativo: EstadoGrifo;
  ultima_revision: string;
}

export async function listarGrifos(): Promise<Grifo[]> {
  return apiClient.get<Grifo[]>('/grifos');
}

export async function actualizarEstadoGrifo(
  id_grifo: number,
  input: ActualizarEstadoGrifoInput,
): Promise<Grifo> {
  return apiClient.patch<Grifo>(`/grifos/${id_grifo}`, input);
}
