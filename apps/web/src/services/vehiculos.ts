import { apiClient } from './apiClient';
import { listarCompanias, type CompaniaOption } from './usuarios';

export type { CompaniaOption };
export { listarCompanias };

export type EstadoVehiculo = 'operativo' | 'en_mantencion' | 'fuera_de_servicio';

export interface Vehiculo {
  id_vehiculo: number;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number | string;
  estado_operativo: EstadoVehiculo;
  id_compania: number;
  coordenadas?: any;
}

export interface PaginatedVehiculos {
  data: Vehiculo[];
  total: number;
  page: number;
}

export const listarVehiculos = (params?: { estado?: string; q?: string }) => {
  const url = new URL(import.meta.env.VITE_API_URL + '/vehiculos');
  if (params?.estado) url.searchParams.append('estado', params.estado);
  if (params?.q) url.searchParams.append('q', params.q);
  return apiClient.get<PaginatedVehiculos>(url.pathname + url.search).then(r => r.data);
};

export const crearVehiculo = (body: unknown) => apiClient.post<Vehiculo>('/vehiculos', body);
export const editarVehiculo = (id: number, body: unknown) => apiClient.patch<Vehiculo>(`/vehiculos/${id}`, body);

