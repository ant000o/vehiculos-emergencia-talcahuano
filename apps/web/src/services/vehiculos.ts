/**
 * Servicio de vehículos (HU-03) — conectado al backend real.
 * Reutiliza listarCompanias() de usuarios.ts para no duplicar esa llamada.
 */

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
  // El backend usa bigint para este campo; el driver de Postgres a veces
  // lo entrega como string para no perder precisión. Lo tratamos como tal
  // al mostrarlo (ver VehiculosTable).
  kilometraje: number | string;
  estado_operativo: EstadoVehiculo;
  id_compania: number;
}

export interface CrearVehiculoInput {
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje?: number;
  estado_operativo?: EstadoVehiculo;
  id_compania: number;
}

// La patente no se edita: es el identificador único del vehículo, no forma
// parte de su "ficha técnica" en el sentido que pide la HU-04.
export type EditarVehiculoInput = Omit<CrearVehiculoInput, 'patente'>;

export async function listarVehiculos(): Promise<Vehiculo[]> {
  return apiClient.get<Vehiculo[]>('/vehiculos');
}

export async function crearVehiculo(input: CrearVehiculoInput): Promise<Vehiculo> {
  return apiClient.post<Vehiculo>('/vehiculos', input);
}

export async function editarVehiculo(
  id_vehiculo: number,
  input: EditarVehiculoInput,
): Promise<Vehiculo> {
  return apiClient.patch<Vehiculo>(`/vehiculos/${id_vehiculo}`, input);
}
