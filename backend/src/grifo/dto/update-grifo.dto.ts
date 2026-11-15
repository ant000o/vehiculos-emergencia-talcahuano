import { PartialType } from '@nestjs/mapped-types';
import { CreateGrifoDto } from './create-grifo.dto';

export class UpdateGrifoDto extends PartialType(CreateGrifoDto) {}
