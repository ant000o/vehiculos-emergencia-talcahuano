import { IsString, IsNotEmpty, MaxLength, IsInt, IsOptional, IsNumber, Min, IsEnum, IsDateString, ValidateIf } from 'class-validator';
import { EstadoMantencion } from '../../common/enums/estados.enum';

export class CreateMantencionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tipo_mantencion: string;

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

  @IsInt()
  id_vehiculo: number;

  // Debe venir id_usuario_mecanico O taller_externo (regla también reforzada por CHECK en la BD)
  @IsInt()
  @ValidateIf((o) => !o.taller_externo)
  id_usuario_mecanico?: number;

  @IsString()
  @MaxLength(150)
  @ValidateIf((o) => !o.id_usuario_mecanico)
  taller_externo?: string;
}
