import { api } from './api';
import { Vehiculo } from '../types/vehiculo';

// El backend responde paginado: { data, total, page, limit, pages }.
// Se acepta también un arreglo plano por si el formato cambia.
// `q` busca (ILIKE, sin distinguir mayúsculas) por patente, marca o modelo.
export async function listarVehiculos(q?: string): Promise<Vehiculo[]> {
  const termino = q?.trim();
  const { data } = await api.get('/vehiculos', {
    params: { limit: 200, ...(termino ? { q: termino } : {}) },
  });
  return Array.isArray(data) ? data : data.data;
}

export async function obtenerVehiculo(id: number): Promise<Vehiculo> {
  const { data } = await api.get<Vehiculo>(`/vehiculos/${id}`);
  return data;
}