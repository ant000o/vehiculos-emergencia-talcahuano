import { IsObject, IsString, IsNotEmpty, MaxLength, IsEnum, IsInt, IsOptional, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoEmergencia, RolEnDespacho } from '../../common/enums/estados.enum';

export class TripulanteAsignadoDto {
  @IsInt()
  id_usuario: number;

  @IsEnum(RolEnDespacho)
  @IsOptional()
  rol_en_despacho?: RolEnDespacho;
}

export class CreateDespachoEmergenciaDto {
  @IsDateString()
  @IsOptional()
  fecha_hora_despacho?: string;

  // GeoJSON Point
  @IsObject()
  coordenada_destino: object;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  tipo_emergencia: string;

  @IsEnum(EstadoEmergencia)
  @IsOptional()
  estado_emergencia?: EstadoEmergencia;

  @IsInt()
  id_vehiculo: number;

  @IsInt()
  @IsOptional()
  id_grifo?: number;

  @IsInt()
  id_compania: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TripulanteAsignadoDto)
  tripulacion?: TripulanteAsignadoDto[];
}
