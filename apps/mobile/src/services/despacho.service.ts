import { api } from './api';
import { DespachoEmergencia, EstadoEmergencia } from '../types/despacho';
 
export async function listarDespachos(): Promise<DespachoEmergencia[]> {
  const { data } = await api.get<DespachoEmergencia[]>('/despachos-emergencia');
  return data;
}
 
// El backend aún no filtra por estado (pendiente para el equipo), así que se
// filtra aquí y se ordena del más reciente al más antiguo.
export async function listarDespachosEnCurso(): Promise<DespachoEmergencia[]> {
  const todos = await listarDespachos();
  return todos
    .filter((d) => d.estado_emergencia === EstadoEmergencia.EN_CURSO)
    .sort(
      (a, b) =>
        new Date(b.fecha_hora_despacho).getTime() - new Date(a.fecha_hora_despacho).getTime(),
    );
}
 