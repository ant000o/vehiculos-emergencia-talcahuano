import { IsIn } from 'class-validator';

export class ResponderDespachoDto {
    @IsIn(['voy', 'no_voy'], { message: "decision debe ser 'voy' o 'no_voy'" })
    decision: 'voy' | 'no_voy';
}