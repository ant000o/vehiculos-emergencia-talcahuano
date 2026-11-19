import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Uso: @Roles('administrador') o @Roles('administrador', 'capitan')
// Los strings deben coincidir con usuario.rol.nombre_rol en la BD.
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
