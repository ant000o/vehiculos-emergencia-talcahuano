import { api } from './api';
import { RegistroOperatividad } from '../types/registroOperatividad';
 
export async function listarRegistrosOperatividad(): Promise<RegistroOperatividad[]> {
  const { data } = await api.get<RegistroOperatividad[]>('/registros-operatividad');
  return data;
}
 
export async function obtenerUltimoRegistroDeVehiculo(
  idVehiculo: number,
): Promise<RegistroOperatividad | null> {
  const registros = await listarRegistrosOperatividad();
  const delVehiculo = registros.filter((r) => r.id_vehiculo === idVehiculo);
  if (delVehiculo.length === 0) return null;
 
  return delVehiculo.reduce((masReciente, actual) =>
    new Date(actual.fecha_hora_registro) > new Date(masReciente.fecha_hora_registro)
      ? actual
      : masReciente,
  );
}
 
export async function obtenerUltimosRegistrosPorVehiculo(): Promise<
  Map<number, RegistroOperatividad>
> {
  const registros = await listarRegistrosOperatividad();
  const ultimos = new Map<number, RegistroOperatividad>();
 
  for (const r of registros) {
    const actual = ultimos.get(r.id_vehiculo);
    if (!actual || new Date(r.fecha_hora_registro) > new Date(actual.fecha_hora_registro)) {
      ultimos.set(r.id_vehiculo, r);
    }
  }
 
  return ultimos;
}
 
export async function crearRegistroOperatividad(payload: {
  id_vehiculo: number;
  id_usuario: number;
  nivel_combustible?: number;
  nivel_agua?: number;
  nivel_aceite?: number;
  observaciones?: string;
}): Promise<RegistroOperatividad> {
  const { data } = await api.post<RegistroOperatividad>('/registros-operatividad', payload);
  return data;
}