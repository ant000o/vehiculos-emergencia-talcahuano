import { IsInt, Min, IsNumber } from 'class-validator';

export class CreateDetalleArticuloMantencionDto {
  @IsInt()
  @Min(1)
  cantidad: number;

  // Si no se envía, el servicio lo completa con el costo_unitario_actual del artículo.
  @IsNumber()
  @Min(0)
  costo_unitario_historico?: number;

  @IsInt()
  id_mantencion: number;

  @IsInt()
  id_articulo: number;
}
