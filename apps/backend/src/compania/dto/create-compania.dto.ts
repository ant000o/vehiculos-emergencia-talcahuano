import { IsString, IsNotEmpty, IsInt, IsOptional, MaxLength, IsObject } from 'class-validator';

export class CreateCompaniaDto {
  @IsInt()
  numero_compania: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  // GeoJSON Point, ej: { type: 'Point', coordinates: [-73.116, -36.719] }
  @IsObject()
  @IsOptional()
  ubicacion_geo?: object;
}
