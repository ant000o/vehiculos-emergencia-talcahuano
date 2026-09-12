import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateArticuloInventarioDto } from './create-articulo_inventario.dto';

// stock_actual queda fuera: se actualiza solo vía movimiento_inventario.
export class UpdateArticuloInventarioDto extends PartialType(
  OmitType(CreateArticuloInventarioDto, ['stock_actual'] as const),
) {}
