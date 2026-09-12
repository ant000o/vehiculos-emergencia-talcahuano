import { PartialType } from '@nestjs/mapped-types';
import { CreateCompaniaDto } from './create-compania.dto';

export class UpdateCompaniaDto extends PartialType(CreateCompaniaDto) {}
