export enum TipoMantencion {
  PREVENTIVA = 'preventiva',
  CORRECTIVA = 'correctiva',
  REVISION = 'revision',
}

export enum EstadoMantencion {
  PENDIENTE = 'pendiente',
  EN_PROCESO = 'en_proceso',
  FINALIZADA = 'finalizada',
  CANCELADA = 'cancelada',
}

export interface CategoriaArticulo {
  id_categoria: number;
  nombre_categoria: string;
}

export interface ArticuloInventario {
  id_articulo: number;
  nombre_articulo: string;
  stock_actual: number;
  costo_unitario_actual: number;
  id_categoria: number;
  categoria: CategoriaArticulo;
}

export interface DetalleArticuloMantencion {
  id_detalle: number;
  cantidad: number;
  costo_unitario_historico: number;
  id_mantencion: number;
  id_articulo: number;
  articulo: ArticuloInventario;
}

export interface Mantencion {
  id_mantencion: number;
  tipo_mantencion: TipoMantencion;
  fecha_ingreso: string;
  fecha_salida: string | null;
  descripcion_falla: string | null;
  costo_mano_obra: number;
  estado_mantencion: EstadoMantencion;
  id_vehiculo: number;
  vehiculo: {
    id_vehiculo: number;
    patente: string;
  };
  id_usuario_mecanico: number | null;
  usuarioMecanico: {
    id_usuario: number;
    nombre: string;
    apellidos: string;
  } | null;
  taller_externo: string | null;
  detalles_articulos?: DetalleArticuloMantencion[];
}

export interface CreateMantencionPayload {
  tipo_mantencion: TipoMantencion;
  descripcion_falla?: string;
  id_vehiculo: number;
  id_usuario_mecanico?: number;
  taller_externo?: string;
}

export interface CreateDetalleArticuloPayload {
  cantidad: number;
  id_mantencion: number;
  id_articulo: number;
}
