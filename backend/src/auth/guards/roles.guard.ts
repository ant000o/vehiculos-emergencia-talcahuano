import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSION_KEY, RequiredPermissionMetadata } from '../decorators/permissions.decorator';
import { JwtPayload } from '../types/jwt-payload.type';
import { RbacService } from '../services/rbac.service';

/**
 * Guard Centralizado de Autorización (RBAC + Scope).
 * Evalúa en orden de prioridad:
 * 1. Superadministrador: Acceso total e irrestricto (GLOBAL, CRUD).
 * 2. Si el endpoint tiene @RequirePermission(modulo, accion): evalúa dinámicamente
 *    contra la base de datos/caché y adjunta request.rbacScope ('GLOBAL' | 'COMPANY' | 'PARTICIPATION').
 * 3. Si el endpoint tiene @Roles(...): valida rol asegurando que superadmin o roles permitidos accedan.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<RequiredPermissionMetadata>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta no tiene ni @RequirePermission ni @Roles, acceso permitido
    if (!requiredPermission && (!rolesRequeridos || rolesRequeridos.length === 0)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('Sesión inválida o expirada');
    }

    // 1. Superadministrador universal (acceso GLOBAL a todo)
    if (await this.rbacService.isSuperAdmin(user)) {
      request.rbacScope = 'GLOBAL';
      request.rbacUser = user;
      return true;
    }

    // 2. Evaluación prioritaria de Permiso RBAC dinámico (@RequirePermission)
    if (requiredPermission) {
      const { modulo, accion } = requiredPermission;
      const check = await this.rbacService.checkAccess(user, modulo, accion);

      if (!check.autorizado || check.alcance === 'NONE') {
        throw new ForbiddenException(
          check.motivo || `No cuentas con permisos para la acción '${accion}' en el módulo '${modulo}'.`,
        );
      }

      request.rbacScope = check.alcance;
      request.rbacUser = user;
      return true;
    }

    // 3. Fallback de compatibilidad con @Roles(...)
    if (rolesRequeridos && rolesRequeridos.length > 0) {
      const rawRole = user.nombre_rol ?? (user as any).rol;
      const userRole = String(rawRole || '').toLowerCase().trim();

      const tienePermiso = rolesRequeridos.some((r) => {
        const req = r.toLowerCase().trim();
        if (req === userRole) return true;
        if (req === 'capitan' && (userRole === 'director' || userRole === 'comandante')) return true;
        return false;
      });

      if (!userRole || !tienePermiso) {
        throw new ForbiddenException('No tienes permisos suficientes para realizar esta acción');
      }

      // Por defecto asigna COMPANY para roles de compañía y GLOBAL para comandante/central
      if (userRole === 'comandante' || userRole === 'central') {
        request.rbacScope = 'GLOBAL';
      } else {
        request.rbacScope = 'COMPANY';
      }
      request.rbacUser = user;
      return true;
    }

    return true;
  }
}

// Alias exportado para compatibilidad si se prefiere nombrar RbacGuard
export { RolesGuard as RbacGuard };
