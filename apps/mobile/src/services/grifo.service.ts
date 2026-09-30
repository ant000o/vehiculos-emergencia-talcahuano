import { api } from './api';
import { Grifo, UpdateEstadoGrifoPayload } from '../types/grifo';

export async function listarGrifos(): Promise<Grifo[]> {
  const { data } = await api.get<Grifo[]>('/grifos');
  return data;
}

// Mobile solo actualiza el estado de grifos ya existentes -- la creación
// y ubicación en el mapa se maneja desde la web (Leaflet).
export async function actualizarEstadoGrifo(
  id: number,
  payload: UpdateEstadoGrifoPayload,
): Promise<Grifo> {
  const { data } = await api.patch<Grifo>(`/grifos/${id}`, payload);
  return data;
}
