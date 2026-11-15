import { IsInt, IsOptional, IsEnum } from 'class-validator';
import { RolEnDespacho } from '../../common/enums/estados.enum';

export class CreateDespachoPersonalDto {
  @IsInt()
  id_despacho: number;

  @IsInt()
  id_usuario: number;

  @IsEnum(RolEnDespacho)
  @IsOptional()
  rol_en_despacho?: RolEnDespacho;
}
