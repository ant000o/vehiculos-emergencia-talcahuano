import { IsEnum, IsInt, Min, IsString, IsOptional } from 'class-validator';
import { TipoMovimiento } from '../../common/enums/estados.enum';

export class CreateMovimientoInventarioDto {
  @IsEnum(TipoMovimiento)
  tipo_movimiento: TipoMovimiento;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsString()
  @IsOptional()
  observacion?: string;

  @IsInt()
  id_articulo: number;

  @IsInt()
  @IsOptional()
  id_mantencion?: number;
}
