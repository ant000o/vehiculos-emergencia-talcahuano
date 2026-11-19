import { SetMetadata } from '@nestjs/common';

export interface RequiredPermissionMetadata {
  modulo: string;
  accion: 'view' | 'create' | 'update' | 'delete' | string;
}

export const PERMISSION_KEY = 'required_permission';

/**
 * Decorador para proteger endpoints mediante la matriz dinámica RBAC.
 * Ejemplo: @RequirePermission('vehiculos', 'view')
 */
export const RequirePermission = (modulo: string, accion: 'view' | 'create' | 'update' | 'delete' | string = 'view') =>
  SetMetadata(PERMISSION_KEY, { modulo, accion });
