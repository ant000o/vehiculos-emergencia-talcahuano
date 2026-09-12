import { IsInt, IsNumber, Min, Max, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateRegistroOperatividadDto {
  @IsDateString()
  @IsOptional()
  fecha_hora_registro?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  nivel_combustible?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  nivel_agua?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  nivel_aceite?: number;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsInt()
  id_usuario: number;

  @IsInt()
  id_vehiculo: number;
}
