import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';

// La contraseña no se actualiza por este endpoint; eso se maneja aparte
// (ej. un endpoint /usuarios/:id/password) cuando se implemente auth.
export class UpdateUsuarioDto extends PartialType(OmitType(CreateUsuarioDto, ['password'] as const)) {}
