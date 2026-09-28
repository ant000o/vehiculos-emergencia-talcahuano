import { api } from './api';
import { Mantencion, CreateMantencionPayload } from '../types/mantencion';

export async function listarMantenciones(): Promise<Mantencion[]> {
  const { data } = await api.get<Mantencion[]>('/mantenciones');
  return data;
}

// El backend no filtra por vehículo, igual que registros-operatividad.
export async function listarMantencionesDeVehiculo(idVehiculo: number): Promise<Mantencion[]> {
  const todas = await listarMantenciones();
  return todas
    .filter((m) => m.id_vehiculo === idVehiculo)
    .sort((a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime());
}

export async function obtenerMantencion(id: number): Promise<Mantencion> {
  const { data } = await api.get<Mantencion>(`/mantenciones/${id}`);
  return data;
}

export async function crearMantencion(payload: CreateMantencionPayload): Promise<Mantencion> {
  const { data } = await api.post<Mantencion>('/mantenciones', payload);
  return data;
}
