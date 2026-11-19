import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoriaArticuloDto } from './create-categoria_articulo.dto';

export class UpdateCategoriaArticuloDto extends PartialType(CreateCategoriaArticuloDto) {}
