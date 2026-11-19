import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtPayload } from '../types/jwt-payload.type';

export type RbacScope = 'GLOBAL' | 'COMPANY' | 'PARTICIPATION' | 'NONE';

interface CachedRolePermissions {
  permisos: Set<string>;
  alcancesPorModulo: Map<string, RbacScope>;
  cachedAt: number;
}

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);
  private readonly cache = new Map<number, CachedRolePermissions>();
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minuto de respaldo si no hay invalidación explícita

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Invalida la caché de permisos de un rol (o de todos si no se indica idRol).
   * Debe llamarse inmediatamente cuando se alteren permisos o alcances en la administración.
   */
  invalidateCache(idRol?: number): void {
    if (idRol) {
      this.cache.delete(idRol);
      this.logger.log(`Caché RBAC invalidada para el rol ${idRol}`);
    } else {
      this.cache.clear();
      this.logger.log('Caché RBAC global invalidada completamente');
    }
  }

  /**
   * Determina si el usuario posee rol Administrador de manera fidedigna.
   * Regla de Superadministrador: Acceso total e irrestricto (GLOBAL, CRUD).
   */
  async isSuperAdmin(user: JwtPayload): Promise<boolean> {
    if (!user) return false;

    // Comprobación rápida por nombre_rol en token
    const nombreRol = String(user.nombre_rol || (user as any).rol || '').toLowerCase().trim();
    if (nombreRol === 'administrador') return true;

    // Validación contra BD si viene id_rol para evitar inconsistencias
    if (user.id_rol) {
      try {
        const rows = await this.dataSource.query(
          `SELECT nombre_rol FROM rol WHERE id_rol = $1`,
          [user.id_rol],
        );
        if (rows.length > 0 && String(rows[0].nombre_rol).toLowerCase().trim() === 'administrador') {
          return true;
        }
      } catch (err) {
        this.logger.error('Error al verificar superadministrador en BD:', err);
      }
    }

    return false;
  }

  /**
   * Carga desde BD o caché los permisos y alcances activos del rol.
   */
  async getPermissionsForRole(idRol: number): Promise<CachedRolePermissions> {
    const cached = this.cache.get(idRol);
    const now = Date.now();
    if (cached && now - cached.cachedAt < this.CACHE_TTL_MS) {
      return cached;
    }

    try {
      const rows = await this.dataSource.query(
        `SELECT p.codigo, p.modulo, rp.alcance
         FROM rol_permiso rp
         JOIN permiso p ON p.id_permiso = rp.id_permiso
         WHERE rp.id_rol = $1 AND p.activo = true`,
        [idRol],
      );

      const permisos = new Set<string>();
      const alcancesPorModulo = new Map<string, RbacScope>();

      for (const row of rows) {
        permisos.add(String(row.codigo).trim());
        const mod = String(row.modulo).toLowerCase().trim();
        const rawAlcance = String(row.alcance || 'COMPANY').toUpperCase().trim();

        let normalizado: RbacScope = 'COMPANY';
        if (rawAlcance === 'GLOBAL' || rawAlcance === 'TODAS_COMPANIAS') {
          normalizado = 'GLOBAL';
        } else if (rawAlcance === 'PARTICIPATION') {
          normalizado = 'PARTICIPATION';
        } else if (rawAlcance === 'NONE') {
          normalizado = 'NONE';
        } else {
          normalizado = 'COMPANY';
        }

        const previo = alcancesPorModulo.get(mod);
        if (previo !== 'GLOBAL') {
          alcancesPorModulo.set(mod, normalizado);
        };
      }

      const item: CachedRolePermissions = {
        permisos,
        alcancesPorModulo,
        cachedAt: now,
      };
      this.cache.set(idRol, item);
      return item;
    } catch (err) {
      this.logger.error(`Error al cargar permisos para rol ${idRol}:`, err);
      return { permisos: new Set(), alcancesPorModulo: new Map(), cachedAt: now };
    }
  }

  /**
   * Evalúa la regla central: ROL + MÓDULO + ACCIÓN + ALCANCE
   */
  async checkAccess(
    user: JwtPayload,
    modulo: string,
    accion: string = 'view',
  ): Promise<{ autorizado: boolean; alcance: RbacScope; motivo?: string }> {
    if (!user) {
      return { autorizado: false, alcance: 'NONE', motivo: 'Usuario no autenticado' };
    }

    // 1. Regla de Superadministrador (Bypass absoluto)
    if (await this.isSuperAdmin(user)) {
      return { autorizado: true, alcance: 'GLOBAL' };
    }

    if (!user.id_rol) {
      return { autorizado: false, alcance: 'NONE', motivo: 'Usuario sin rol asignado' };
    }

    const { permisos, alcancesPorModulo } = await this.getPermissionsForRole(user.id_rol);
    const modKey = modulo.toLowerCase().trim();
    const accKey = accion.toLowerCase().trim();

    // Comprobar código normalizado modulo.accion (ej: vehiculos.view)
    const codigoNormalizado = `${modKey}.${accKey}`;
    let tienePermiso = permisos.has(codigoNormalizado);

    // Fallback: Si el argumento modulo ya venía como código completo (ej: 'personal.ver' o 'mantencion.crear')
    if (!tienePermiso && permisos.has(modulo)) {
      tienePermiso = true;
    }

    if (!tienePermiso) {
      return {
        autorizado: false,
        alcance: 'NONE',
        motivo: `No cuenta con el permiso ${codigoNormalizado}`,
      };
    }

    const alcance = alcancesPorModulo.get(modKey) || 'COMPANY';
    if (alcance === 'NONE') {
      return {
        autorizado: false,
        alcance: 'NONE',
        motivo: `El alcance del módulo ${modKey} está configurado como NONE`,
      };
    }

    return { autorizado: true, alcance };
  }

  /**
   * Mapeo de compatibilidad hacia atrás con los 21 códigos antiguos.
   */
  private checkLegacyPermission(permisos: Set<string>, modulo: string, accion: string): boolean {
    const legacyMap: Record<string, string[]> = {
      'vehiculos.view': ['vehiculo.ver', 'vehiculo.disponibilidad'],
      'vehiculos.create': ['vehiculo.gestionar'],
      'vehiculos.update': ['vehiculo.gestionar'],
      'vehiculos.delete': ['vehiculo.gestionar'],
      'usuarios.view': ['personal.ver'],
      'usuarios.create': ['personal.gestionar'],
      'usuarios.update': ['personal.gestionar'],
      'usuarios.delete': ['personal.gestionar'],
      'despachos.view': ['despacho.ver'],
      'despachos.create': ['despacho.gestionar'],
      'despachos.update': ['despacho.gestionar'],
      'despachos.delete': ['despacho.gestionar'],
      'grifos.view': ['operatividad.ver', 'despacho.ver'],
      'grifos.create': ['operatividad.editar'],
      'grifos.update': ['operatividad.editar'],
      'inventario.view': ['inventario.ver'],
      'inventario.create': ['inventario.gestionar'],
      'inventario.update': ['inventario.gestionar'],
      'inventario.delete': ['inventario.gestionar'],
      'mantenciones.view': ['mantencion.ver', 'mantencion.historial'],
      'mantenciones.create': ['mantencion.crear'],
      'mantenciones.update': ['mantencion.editar'],
      'operatividad.view': ['operatividad.ver'],
      'operatividad.create': ['operatividad.crear'],
      'operatividad.update': ['operatividad.editar'],
      'dashboard.view': ['dashboard.general', 'dashboard.compania'],
      'mapa.view': ['despacho.ver'],
      'mapa.create': ['despacho.gestionar'],
      'mapa.update': ['despacho.gestionar'],
    };

    const targetKey = `${modulo}.${accion}`;
    const legacyCandidates = legacyMap[targetKey];
    if (legacyCandidates) {
      for (const legacyCode of legacyCandidates) {
        if (permisos.has(legacyCode)) return true;
      }
    }
    return false;
  }
}
