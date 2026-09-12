import { PartialType } from '@nestjs/mapped-types';
import { CreateRegistroOperatividadDto } from './create-registro_operatividad.dto';

export class UpdateRegistroOperatividadDto extends PartialType(CreateRegistroOperatividadDto) {}
