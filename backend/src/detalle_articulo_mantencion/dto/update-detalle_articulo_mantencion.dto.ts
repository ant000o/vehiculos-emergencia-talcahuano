import { PartialType } from '@nestjs/mapped-types';
import { CreateDetalleArticuloMantencionDto } from './create-detalle_articulo_mantencion.dto';

export class UpdateDetalleArticuloMantencionDto extends PartialType(CreateDetalleArticuloMantencionDto) {}
