import { apiClient as api } from './apiClient';

export interface DespachoTripulante {
  id_despacho: number;
  id_usuario: number;
  rol_en_despacho: 'conductor' | 'brigadista' | 'jefe_despacho' | string;
  usuario?: {
    id_usuario: number;
    nombre: string;
    apellidos: string;
    email?: string;
  };
}

export interface DespachoEmergencia {
  id_despacho: number;
  fecha_hora_despacho: string;
  coordenada_destino?: { type: string; coordinates: [number, number] } | [number, number];
  tipo_emergencia: string;
  estado_emergencia: 'en_curso' | 'controlada' | 'finalizada' | 'cancelada' | string;
  id_vehiculo: number;
  id_grifo?: number | null;
  id_compania: number;
  vehiculo?: {
    id_vehiculo: number;
    patente: string;
    marca: string;
    modelo: string;
    anio?: number;
    estado_operativo?: string;
    kilometraje?: number;
  };
  grifo?: {
    id_grifo: number;
    direccion?: string;
    estado_operativo?: string;
  } | null;
  compania?: {
    id_compania: number;
    nombre: string;
  };
  tripulacion?: DespachoTripulante[];
  created_at?: string;
  updated_at?: string;
}

export interface TripulanteInput {
  id_usuario: number;
  rol_en_despacho: 'conductor' | 'brigadista' | 'jefe_despacho' | string;
}

export interface CrearDespachoDto {
  id_despacho?: number;
  fecha_hora_despacho?: string;
  coordenada_destino: { type: string; coordinates: [number, number] };
  tipo_emergencia: string;
  estado_emergencia?: string;
  id_vehiculo: number;
  id_grifo?: number | null;
  id_compania: number;
  tripulacion?: TripulanteInput[];
}

export const crearDespacho = (dto: CrearDespachoDto) => 
  api.post<DespachoEmergencia>('/despachos-emergencia', dto);

export const listarDespachos = () => 
  api.get<DespachoEmergencia[]>('/despachos-emergencia');

export const obtenerDespacho = (id: number) =>
  api.get<DespachoEmergencia>(`/despachos-emergencia/${id}`);

export const cambiarEstadoDespacho = (id: number, nuevoEstado: string) =>
  api.patch<DespachoEmergencia>(`/despachos-emergencia/${id}`, { estado_emergencia: nuevoEstado });
