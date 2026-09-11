import { PartialType } from '@nestjs/swagger';
import { CreateCompañiaDto } from './create-compañia.dto';

export class UpdateCompañiaDto extends PartialType(CreateCompañiaDto) {}
