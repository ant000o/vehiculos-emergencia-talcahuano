import { apiClient as api } from './apiClient';

export interface DespachoEmergencia {
  id_despacho?: number;
  fecha_hora_despacho?: string;
  coordenada_destino: { type: string; coordinates: [number, number] };
  tipo_emergencia: string;
  estado_emergencia?: string;
  id_vehiculo: number;
  id_grifo: number;
  id_compania: number;
}

export const crearDespacho = (dto: DespachoEmergencia) => 
  api.post('/despacho-emergencia', dto);

export const listarDespachos = () => 
  api.get('/despacho-emergencia');


