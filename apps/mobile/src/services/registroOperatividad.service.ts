import { api } from './api';
import { RegistroOperatividad, CreateRegistroOperatividadPayload } from '../types/registroOperatividad';

export async function listarRegistrosOperatividad(): Promise<RegistroOperatividad[]> {
  const { data } = await api.get<RegistroOperatividad[]>('/registros-operatividad');
  return data;
}

// El backend no filtra por vehículo (ver nota anterior) — filtramos acá
// y nos quedamos con el más reciente por fecha_hora_registro.
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

export async function crearRegistroOperatividad(
  payload: CreateRegistroOperatividadPayload,
): Promise<RegistroOperatividad> {
  const { data } = await api.post<RegistroOperatividad>('/registros-operatividad', payload);
  return data;
}