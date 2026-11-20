import { api } from './api';
import { DespachoEmergencia, EstadoEmergencia } from '../types/despacho';

export async function listarDespachos(): Promise<DespachoEmergencia[]> {
  const { data } = await api.get<DespachoEmergencia[]>('/despachos-emergencia');
  return data;
}

export async function obtenerDespacho(id: number): Promise<DespachoEmergencia> {
  const { data } = await api.get<DespachoEmergencia>(`/despachos-emergencia/${id}`);
  return data;
}

export async function listarDespachosEnCurso(): Promise<DespachoEmergencia[]> {
  const todos = await listarDespachos();
  return todos
    .filter((d) => d.estado_emergencia === EstadoEmergencia.EN_CURSO)
    .sort(
      (a, b) =>
        new Date(b.fecha_hora_despacho).getTime() - new Date(a.fecha_hora_despacho).getTime(),
    );
}

export async function finalizarDespacho(id: number): Promise<DespachoEmergencia> {
  const { data } = await api.patch<DespachoEmergencia>(`/despachos-emergencia/${id}`, {
    estado_emergencia: EstadoEmergencia.FINALIZADA,
  });
  return data;
}

export type DecisionApoyo = 'voy' | 'no_voy';


export async function responderApoyo(id: number, decision: DecisionApoyo): Promise<void> {
  await api.post(`/despachos-emergencia/${id}/respuesta`, { decision });
}
