import { IsString, IsOptional, MaxLength } from 'class-validator';

// Solo se puede actualizar el rol; la PK compuesta no se edita (se borra y crea de nuevo).
export class UpdateDespachoPersonalDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  rol_en_despacho?: string;
}
