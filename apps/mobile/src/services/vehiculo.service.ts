import { api } from './api';
import { Vehiculo } from '../types/vehiculo';

export async function listarVehiculos(): Promise<Vehiculo[]> {
  const { data } = await api.get<Vehiculo[]>('/vehiculos');
  return data;
}

export async function obtenerVehiculo(id: number): Promise<Vehiculo> {
  const { data } = await api.get<Vehiculo>(`/vehiculos/${id}`);
  return data;
}