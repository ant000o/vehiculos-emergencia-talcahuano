import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateRolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre_rol: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
