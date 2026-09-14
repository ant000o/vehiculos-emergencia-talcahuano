import { PartialType } from '@nestjs/mapped-types';
import { CreateMantencionDto } from './create-mantencion.dto';

export class UpdateMantencionDto extends PartialType(CreateMantencionDto) {}
