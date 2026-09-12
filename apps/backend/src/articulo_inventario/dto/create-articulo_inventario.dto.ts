import { IsString, IsNotEmpty, MaxLength, IsInt, Min, IsNumber, IsOptional } from 'class-validator';

export class CreateArticuloInventarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre_articulo: string;

  // Stock inicial. Para movimientos posteriores usar el endpoint de
  // movimientos-inventario (entrada/salida), no editar esto directo.
  @IsInt()
  @Min(0)
  @IsOptional()
  stock_actual?: number;

  @IsNumber()
  @Min(0)
  costo_unitario_actual: number;

  @IsInt()
  id_categoria: number;
}