import { PartialType } from '@nestjs/mapped-types';
import { CreateDespachoEmergenciaDto } from './create-despacho_emergencia.dto';

export class UpdateDespachoEmergenciaDto extends PartialType(CreateDespachoEmergenciaDto) {}
