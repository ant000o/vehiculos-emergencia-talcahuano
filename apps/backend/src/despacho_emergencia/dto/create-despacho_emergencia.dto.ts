import { IsObject, IsString, IsNotEmpty, MaxLength, IsEnum, IsInt, IsOptional, IsDateString } from 'class-validator';
import { EstadoEmergencia } from '../../common/enums/estados.enum';

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
}
