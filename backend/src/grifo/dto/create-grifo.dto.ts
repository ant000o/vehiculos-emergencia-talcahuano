import { IsObject, IsString, IsOptional, MaxLength, IsEnum, IsInt, IsDateString } from 'class-validator';
import { EstadoGrifo } from '../../common/enums/estados.enum';

export class CreateGrifoDto {
  // GeoJSON Point, ej: { type: 'Point', coordinates: [-73.116, -36.719] }
  @IsObject()
  coordenadas: object;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  direccion?: string;

  @IsEnum(EstadoGrifo)
  @IsOptional()
  estado_operativo?: EstadoGrifo;

  @IsDateString()
  @IsOptional()
  ultima_revision?: string;

  @IsInt()
  id_compania: number;
}
