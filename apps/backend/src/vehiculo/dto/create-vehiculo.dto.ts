import { IsString, IsNotEmpty, IsInt, MaxLength, Min, Max, IsEnum, IsOptional } from 'class-validator';
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

  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear() + 1)
  anio: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  kilometraje?: number;

  @IsEnum(EstadoVehiculo)
  @IsOptional()
  estado_operativo?: EstadoVehiculo;

  @IsInt()
  id_compania: number;
}
