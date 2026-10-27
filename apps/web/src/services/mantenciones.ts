/**
 * Servicio de mantenciones — conectado al backend real.
 */

import { apiClient } from './apiClient';

export type TipoMantencion = 'preventiva' | 'correctiva' | 'revision' | 'emergencia';
export type EstadoMantencion = 'pendiente' | 'en_proceso' | 'finalizada' | 'cancelada';

export interface DetalleRepuestoEnMantencion {
  id_detalle: number;
  cantidad: number;
  costo_unitario_historico: number | string;
  id_articulo: number;
  articulo?: {
    id_articulo: number;
    nombre_articulo: string;
  };
}

export interface Mantencion {
  id_mantencion: number;
  tipo_mantencion: TipoMantencion;
  fecha_ingreso: string;
  fecha_salida: string | null;
  descripcion_falla: string | null;
  kilometraje?: number | null;
  costo_mano_obra: number | string;
  estado_mantencion: EstadoMantencion;
  id_vehiculo: number;
  id_usuario_mecanico: number | null;
  taller_externo: string | null;
  vehiculo?: { id_vehiculo: number; patente: string; marca?: string; modelo?: string; kilometraje?: number | string };
  usuarioMecanico?: { id_usuario: number; nombre: string; apellidos: string };
  detalles_articulos?: DetalleRepuestoEnMantencion[];
}

export interface CrearMantencionInput {
  tipo_mantencion: TipoMantencion;
  id_vehiculo: number;
  kilometraje?: number;
  descripcion_falla?: string;
  costo_mano_obra?: number;
  estado_mantencion?: EstadoMantencion;
  id_usuario_mecanico?: number;
  taller_externo?: string;
  fecha_ingreso?: string;
  fecha_salida?: string;
}

export async function listarMantenciones(params?: {
  id_vehiculo?: number;
  estado?: string;
  tipo?: string;
}): Promise<Mantencion[]> {
  const query = new URLSearchParams();
  if (params?.id_vehiculo) query.append('id_vehiculo', String(params.id_vehiculo));
  if (params?.estado) query.append('estado', params.estado);
  if (params?.tipo) query.append('tipo', params.tipo);

  const qs = query.toString();
  return apiClient.get<Mantencion[]>(`/mantenciones${qs ? `?${qs}` : ''}`);
}

export async function obtenerMantencion(id: number): Promise<Mantencion> {
  return apiClient.get<Mantencion>(`/mantenciones/${id}`);
}

export async function crearMantencion(input: CrearMantencionInput): Promise<Mantencion> {
  return apiClient.post<Mantencion>('/mantenciones', {
    ...input,
    fecha_ingreso: input.fecha_ingreso || new Date().toISOString(),
    costo_mano_obra: Number(input.costo_mano_obra ?? 0),
    kilometraje: input.kilometraje !== undefined && input.kilometraje !== null ? Number(input.kilometraje) : undefined,
  });
}

export async function actualizarEstadoMantencion(
  id: number,
  estado: EstadoMantencion,
  fecha_salida?: string,
): Promise<Mantencion> {
  return apiClient.patch<Mantencion>(`/mantenciones/${id}`, {
    estado_mantencion: estado,
    ...(fecha_salida ? { fecha_salida } : {}),
  });
}

// Funciones de compatibilidad
export async function registrarMantencionReactiva(input: {
  descripcion_falla: string;
  costo_mano_obra: number;
  id_vehiculo: number;
  id_usuario_mecanico: number;
  kilometraje?: number;
}): Promise<Mantencion> {
  return crearMantencion({
    tipo_mantencion: 'correctiva',
    estado_mantencion: 'en_proceso',
    descripcion_falla: input.descripcion_falla,
    costo_mano_obra: input.costo_mano_obra,
    id_vehiculo: input.id_vehiculo,
    id_usuario_mecanico: input.id_usuario_mecanico,
    kilometraje: input.kilometraje,
  });
}

export async function registrarMantencionPreventivaFinalizada(input: {
  fecha_ingreso: string;
  fecha_salida: string;
  descripcion_falla?: string;
  costo_mano_obra?: number;
  id_vehiculo: number;
  id_usuario_mecanico: number;
  kilometraje?: number;
}): Promise<Mantencion> {
  const creada = await crearMantencion({
    tipo_mantencion: 'preventiva',
    fecha_ingreso: input.fecha_ingreso,
    fecha_salida: input.fecha_salida,
    descripcion_falla: input.descripcion_falla,
    costo_mano_obra: input.costo_mano_obra,
    id_vehiculo: input.id_vehiculo,
    id_usuario_mecanico: input.id_usuario_mecanico,
    kilometraje: input.kilometraje,
  });
  return actualizarEstadoMantencion(creada.id_mantencion, 'finalizada', input.fecha_salida);
}
