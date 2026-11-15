/**
 * Servicio de inventario de repuestos y kardex (HU-10) — conectado al backend real.
 */

import { apiClient } from './apiClient';

export interface ArticuloInventario {
  id_articulo: number;
  nombre_articulo: string;
  stock_actual: number;
  costo_unitario_actual: number | string;
  id_categoria: number;
  categoria?: { id_categoria: number; nombre_categoria: string };
}

export interface MovimientoInventario {
  id_movimiento: number;
  fecha_movimiento: string;
  tipo_movimiento: 'entrada' | 'salida';
  cantidad: number;
  observacion?: string | null;
  id_articulo: number;
  articulo?: ArticuloInventario;
}

export interface DetalleArticuloMantencion {
  id_detalle: number;
  cantidad: number;
  costo_unitario_historico: number | string;
  id_mantencion: number;
  id_articulo: number;
  articulo?: { id_articulo: number; nombre_articulo: string };
}

export interface DescontarRepuestoInput {
  cantidad: number;
  id_mantencion: number;
  id_articulo: number;
  costo_unitario_historico: number;
}

export interface CrearMovimientoInput {
  tipo_movimiento: 'entrada' | 'salida';
  cantidad: number;
  id_articulo: number;
  observacion?: string;
}

export async function listarArticulos(): Promise<ArticuloInventario[]> {
  return apiClient.get<ArticuloInventario[]>('/articulos-inventario');
}

export async function listarMovimientos(id_articulo?: number): Promise<MovimientoInventario[]> {
  const path = id_articulo ? `/movimientos-inventario?id_articulo=${id_articulo}` : '/movimientos-inventario';
  return apiClient.get<MovimientoInventario[]>(path);
}

export async function crearMovimientoInventario(input: CrearMovimientoInput): Promise<MovimientoInventario> {
  return apiClient.post<MovimientoInventario>('/movimientos-inventario', input);
}

export async function listarDetallesMantencion(): Promise<DetalleArticuloMantencion[]> {
  return apiClient.get<DetalleArticuloMantencion[]>('/detalles-articulo-mantencion');
}

export async function descontarRepuesto(
  input: DescontarRepuestoInput,
): Promise<DetalleArticuloMantencion> {
  return apiClient.post<DetalleArticuloMantencion>('/detalles-articulo-mantencion', input);
}
