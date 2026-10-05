import { api } from './api';
import { ArticuloInventario, DetalleArticuloMantencion, CreateDetalleArticuloPayload } from '../types/mantencion';

export async function listarArticulos(): Promise<ArticuloInventario[]> {
  const { data } = await api.get<ArticuloInventario[]>('/articulos-inventario');
  return data;
}

// Crea el detalle: un TRIGGER en la base de datos descuenta el stock
// automáticamente. NUNCA llamar además a /movimientos-inventario para esto
// -- descontaría el stock dos veces.
export async function agregarRepuestoAMantencion(
  payload: CreateDetalleArticuloPayload,
): Promise<DetalleArticuloMantencion> {
  const { data } = await api.post<DetalleArticuloMantencion>('/detalles-articulo-mantencion', payload);
  return data;
}
