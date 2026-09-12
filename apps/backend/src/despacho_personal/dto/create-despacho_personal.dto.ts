import { IsInt, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateDespachoPersonalDto {
  @IsInt()
  id_despacho: number;

  @IsInt()
  id_usuario: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  rol_en_despacho?: string;
}
