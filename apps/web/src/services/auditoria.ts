import { apiClient } from './apiClient';

export interface HistorialCambioItem {
  id_historial: number;
  id_usuario: number | null;
  id_compania: number | null;
  tabla_afectada: string;
  id_registro: string;
  accion: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  valores_anteriores: Record<string, any> | null;
  valores_nuevos: Record<string, any> | null;
  fecha_hora: string;
}

export const listarHistorialCambios = (params?: { tabla?: string; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.tabla) query.set('tabla', params.tabla);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiClient.get<HistorialCambioItem[]>(`/historial-cambios${qs ? `?${qs}` : ''}`);
};
