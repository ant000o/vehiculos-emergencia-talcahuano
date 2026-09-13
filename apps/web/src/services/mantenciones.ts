/**
 * Servicio de mantenciones — conectado al backend real.
 *
 * Detalle importante: el backend solo cambia el estado del vehículo a
 * "operativo" dentro de update() cuando estado_mantencion pasa a
 * 'finalizada' o 'cancelada' — NO ocurre si se crea la mantención ya con
 * ese estado. Por eso "registrar una mantención finalizada" son en
 * realidad 2 llamadas: crear, y luego marcar como finalizada.
 */

import { apiClient } from './apiClient';

export type TipoMantencion = 'preventiva' | 'correctiva' | 'revision';
export type EstadoMantencion = 'pendiente' | 'en_proceso' | 'finalizada' | 'cancelada';

export interface Mantencion {
  id_mantencion: number;
  tipo_mantencion: TipoMantencion;
  fecha_ingreso: string;
  fecha_salida: string | null;
  descripcion_falla: string | null;
  costo_mano_obra: number | string;
  estado_mantencion: EstadoMantencion;
  id_vehiculo: number;
  id_usuario_mecanico: number | null;
  taller_externo: string | null;
}

export interface RegistrarMantencionPreventivaInput {
  fecha_ingreso: string;
  fecha_salida: string;
  descripcion_falla?: string;
  costo_mano_obra?: number;
  id_vehiculo: number;
  id_usuario_mecanico: number;
}

export interface RegistrarMantencionReactivaInput {
  descripcion_falla: string;
  costo_mano_obra: number;
  id_vehiculo: number;
  id_usuario_mecanico: number;
}

export async function listarMantenciones(): Promise<Mantencion[]> {
  return apiClient.get<Mantencion[]>('/mantenciones');
}

// Una falla reactiva se REPORTA, no se cierra en el mismo paso (a diferencia
// de la preventiva): por eso es una sola llamada create(), sin el segundo
// PATCH a 'finalizada'. El vehículo puede estar en cualquier estado — la
// falla recién se está documentando ahora.
export async function registrarMantencionReactiva(
  input: RegistrarMantencionReactivaInput,
): Promise<Mantencion> {
  return apiClient.post<Mantencion>('/mantenciones', {
    tipo_mantencion: 'correctiva',
    estado_mantencion: 'en_proceso',
    fecha_ingreso: new Date().toISOString(),
    descripcion_falla: input.descripcion_falla,
    costo_mano_obra: input.costo_mano_obra,
    id_vehiculo: input.id_vehiculo,
    id_usuario_mecanico: input.id_usuario_mecanico,
  });
}

export async function registrarMantencionPreventivaFinalizada(
  input: RegistrarMantencionPreventivaInput,
): Promise<Mantencion> {
  const creada = await apiClient.post<Mantencion>('/mantenciones', {
    tipo_mantencion: 'preventiva',
    fecha_ingreso: input.fecha_ingreso,
    fecha_salida: input.fecha_salida,
    descripcion_falla: input.descripcion_falla,
    costo_mano_obra: input.costo_mano_obra,
    id_vehiculo: input.id_vehiculo,
    id_usuario_mecanico: input.id_usuario_mecanico,
  });

  // Este segundo llamado es el que realmente dispara el cambio automático
  // de estado del vehículo a "operativo" en el backend.
  return apiClient.patch<Mantencion>(`/mantenciones/${creada.id_mantencion}`, {
    estado_mantencion: 'finalizada',
  });
}
