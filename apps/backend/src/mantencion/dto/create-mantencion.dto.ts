import { IsString, IsNotEmpty, MaxLength, IsInt, IsOptional, IsNumber, Min, IsEnum, IsDateString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoMantencion, TipoMantencion } from '../../common/enums/estados.enum';

export class CreateMantencionDto {
  @IsEnum(TipoMantencion)
  tipo_mantencion: TipoMantencion;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  kilometraje?: number;

  @IsDateString()
  @IsOptional()
  fecha_ingreso?: string;

  @IsDateString()
  @IsOptional()
  fecha_salida?: string;

  @IsString()
  @IsOptional()
  descripcion_falla?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costo_mano_obra?: number;

  @IsEnum(EstadoMantencion)
  @IsOptional()
  estado_mantencion?: EstadoMantencion;

  @Type(() => Number)
  @IsInt()
  id_vehiculo: number;

  // Debe venir exactamente uno: id_usuario_mecanico O taller_externo
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  id_usuario_mecanico?: number;

  @IsString()
  @MaxLength(150)
  @IsOptional()
  taller_externo?: string;
}
