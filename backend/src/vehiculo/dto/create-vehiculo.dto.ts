import { IsString, IsNotEmpty, IsInt, MaxLength, Min, Max, IsEnum, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoVehiculo } from '../../common/enums/estados.enum';

export class CreateVehiculoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  patente: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  marca: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  modelo: string;

  @Type(() => Number)
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear() + 1)
  anio: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  kilometraje?: number;

  @IsEnum(EstadoVehiculo)
  @IsOptional()
  estado_operativo?: EstadoVehiculo;

  @Type(() => Number)
  @IsInt()
  id_compania: number;

  // GeoJSON Point con coordenadas en orden [latitud, longitud] (el backend hace el swap)
  // Ejemplo: { "type": "Point", "coordinates": [-36.7196, -73.1168] }
  @IsObject()
  @IsOptional()
  coordenadas?: object;
}

