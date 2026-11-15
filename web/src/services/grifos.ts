/**
 * Servicio de grifos (HU-11) — conectado al backend real.
 *
 * IMPORTANTE — cambio de Carlo en main (common/utils/geo.util.ts):
 * el backend ahora convierte las coordenadas automáticamente y expone
 * al cliente el orden [lat, lng] (no el GeoJSON puro [lng, lat] de antes).
 * O sea: acá SIEMPRE trabajamos en [lat, lng], igual que Leaflet.
 * El backend se encarga de guardarlo como corresponde en PostGIS.
 */

import { apiClient } from './apiClient';
import { listarCompanias, type CompaniaOption } from './usuarios';

export type { CompaniaOption };
export { listarCompanias };

export type EstadoGrifo = 'operativo' | 'en_mantencion' | 'fuera_de_servicio';

export interface PuntoGeografico {
  type: 'Point';
  coordinates: [number, number]; // [lat, lng]
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

export interface CrearGrifoInput {
  coordenadas: PuntoGeografico;
  direccion?: string;
  estado_operativo?: EstadoGrifo;
  ultima_revision?: string;
  id_compania: number;
}

export type EditarGrifoInput = Partial<CrearGrifoInput>;

export async function listarGrifos(): Promise<Grifo[]> {
  return apiClient.get<Grifo[]>('/grifos');
}

export async function crearGrifo(input: CrearGrifoInput): Promise<Grifo> {
  return apiClient.post<Grifo>('/grifos', input);
}

export async function editarGrifo(id_grifo: number, input: EditarGrifoInput): Promise<Grifo> {
  return apiClient.patch<Grifo>(`/grifos/${id_grifo}`, input);
}
