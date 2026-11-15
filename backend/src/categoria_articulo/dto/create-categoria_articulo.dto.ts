import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCategoriaArticuloDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre_categoria: string;
}
