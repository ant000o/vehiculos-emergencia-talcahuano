/**
 * Servicio de inventario de repuestos (HU-10) — conectado al backend real.
 *
 * Importante: stock_actual y movimiento_inventario los mantiene un TRIGGER
 * en la base de datos, no el backend. La ÚNICA forma correcta de descontar
 * stock es crear un detalle_articulo_mantencion — nunca editar el stock
 * directamente. Por diseño de Carlo, esto ya es "transaccional" a nivel de
 * base de datos (justo lo que pide la HU).
 */

import { apiClient } from './apiClient';

export interface ArticuloInventario {
  id_articulo: number;
  nombre_articulo: string;
  stock_actual: number;
  costo_unitario_actual: number | string;
  id_categoria: number;
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
  // ⚠️ Se envía siempre explícito (no se omite) porque el DTO de Carlo
  // tiene este campo marcado @IsNumber()/@Min(0) SIN @IsOptional() — si se
  // omite, el backend lo rechaza con un 400 aunque el tipo diga que es
  // opcional. Reportar para que agregue @IsOptional() en el DTO.
  costo_unitario_historico: number;
}

export async function listarArticulos(): Promise<ArticuloInventario[]> {
  return apiClient.get<ArticuloInventario[]>('/articulos-inventario');
}

export async function listarDetallesMantencion(): Promise<DetalleArticuloMantencion[]> {
  return apiClient.get<DetalleArticuloMantencion[]>('/detalles-articulo-mantencion');
}

export async function descontarRepuesto(
  input: DescontarRepuestoInput,
): Promise<DetalleArticuloMantencion> {
  return apiClient.post<DetalleArticuloMantencion>('/detalles-articulo-mantencion', input);
}
