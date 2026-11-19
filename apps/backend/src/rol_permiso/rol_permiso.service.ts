import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RbacService } from '../auth/services/rbac.service';

export interface ModuloPermisosInput {
  modulo: string;
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  alcance: 'GLOBAL' | 'COMPANY' | 'PARTICIPATION' | 'NONE';
}

@Injectable()
export class RolPermisoService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly rbacService: RbacService,
  ) {}

  /** Devuelve la vista completa de asignaciones */
  async findAll() {
    return this.dataSource.query(`
      SELECT r.id_rol, r.nombre_rol, p.id_permiso, p.codigo,
             p.nombre AS nombre_permiso, p.modulo, p.descripcion,
             p.activo, rp.alcance, rp.created_at AS fecha_asignacion
      FROM rol r
      LEFT JOIN rol_permiso rp ON rp.id_rol = r.id_rol
      LEFT JOIN permiso p ON p.id_permiso = rp.id_permiso
      ORDER BY r.id_rol, p.modulo, p.codigo
    `);
  }

  /** Permisos y alcances de un rol específico estructurados */
  async findByRol(idRol: number) {
    return this.dataSource.query(`
      SELECT p.id_permiso, p.codigo, p.nombre, p.modulo, p.descripcion,
             rp.alcance
      FROM rol_permiso rp
      JOIN permiso p ON p.id_permiso = rp.id_permiso
      WHERE rp.id_rol = $1
      ORDER BY p.modulo, p.codigo
    `, [idRol]);
  }

  /** Alternar asignación de un permiso unitario a un rol */
  async toggle(idRol: number, idPermiso: number, alcance: string = 'COMPANY') {
    // Normalizar alcance
    let alcanceNorm = alcance.toUpperCase();
    if (alcanceNorm === 'PROPIA_COMPANIA') alcanceNorm = 'COMPANY';
    if (alcanceNorm === 'TODAS_COMPANIAS') alcanceNorm = 'GLOBAL';

    const existing = await this.dataSource.query(
      `SELECT * FROM rol_permiso WHERE id_rol = $1 AND id_permiso = $2`,
      [idRol, idPermiso],
    );

    let result;
    if (existing.length > 0) {
      await this.dataSource.query(
        `DELETE FROM rol_permiso WHERE id_rol = $1 AND id_permiso = $2`,
        [idRol, idPermiso],
      );
      result = { asignado: false, id_rol: idRol, id_permiso: idPermiso };
    } else {
      await this.dataSource.query(
        `INSERT INTO rol_permiso (id_rol, id_permiso, alcance) VALUES ($1, $2, $3)`,
        [idRol, idPermiso, alcanceNorm],
      );
      result = { asignado: true, id_rol: idRol, id_permiso: idPermiso, alcance: alcanceNorm };
    }

    // Invalidación inmediata de la caché de permisos
    this.rbacService.invalidateCache(idRol);
    return result;
  }

  /**
   * Guarda de forma atómica y completa la matriz de permisos y alcances de un rol.
   * Invalida la caché para reflejar los cambios en la siguiente petición.
   */
  async guardarMatriz(idRol: number, modulos: ModuloPermisosInput[]) {
    if (!idRol) throw new BadRequestException('ID de rol requerido');

    // Obtener catálogo de permisos
    const permisosRows = await this.dataSource.query(`SELECT id_permiso, codigo, modulo FROM permiso`);
    const permMap: Record<string, number> = {};
    permisosRows.forEach((p: any) => {
      permMap[p.codigo] = p.id_permiso;
    });

    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();

    try {
      // 1. Eliminar asignaciones actuales de los 10 módulos estándar para este rol
      const modulosKeys = modulos.map((m) => m.modulo.toLowerCase().trim());
      await runner.query(
        `DELETE FROM rol_permiso rp
         USING permiso p
         WHERE rp.id_permiso = p.id_permiso
           AND rp.id_rol = $1
           AND p.modulo = ANY($2)`,
        [idRol, modulosKeys],
      );

      // 2. Insertar las nuevas asignaciones según los switches y alcance
      for (const m of modulos) {
        const mod = m.modulo.toLowerCase().trim();
        const alcance = (m.alcance || 'COMPANY').toUpperCase();

        const accionesMap: [boolean, string][] = [
          [m.ver, 'view'],
          [m.crear, 'create'],
          [m.editar, 'update'],
          [m.eliminar, 'delete'],
        ];

        for (const [activado, accion] of accionesMap) {
          if (activado) {
            const codigo = `${mod}.${accion}`;
            const idPermiso = permMap[codigo];
            if (idPermiso) {
              await runner.query(
                `INSERT INTO rol_permiso (id_rol, id_permiso, alcance)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (id_rol, id_permiso) DO UPDATE
                 SET alcance = EXCLUDED.alcance`,
                [idRol, idPermiso, alcance],
              );
            }
          }
        }
      }

      await runner.commitTransaction();

      // Invalidación instantánea en tiempo real de la caché
      this.rbacService.invalidateCache(idRol);

      return { ok: true, mensaje: 'Matriz de permisos y alcances guardada exitosamente' };
    } catch (err) {
      await runner.rollbackTransaction();
      throw err;
    } finally {
      await runner.release();
    }
  }

  /**
   * Restablece la configuración predeterminada del rol según las especificaciones del sistema.
   */
  async restablecerPredeterminados(idRol: number) {
    const rolRes = await this.dataSource.query(`SELECT lower(trim(nombre_rol)) as rol_norm FROM rol WHERE id_rol = $1`, [idRol]);
    if (!rolRes.length) throw new BadRequestException('Rol no encontrado');
    const rolNorm = rolRes[0].rol_norm;

    const defaultsPorRol: Record<string, Record<string, { acciones: string[]; alcance: string }>> = {
      central: {
        inicio: { acciones: ['view'], alcance: 'GLOBAL' },
        dashboard: { acciones: [], alcance: 'NONE' },
        despachos: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        grifos: { acciones: ['view'], alcance: 'GLOBAL' },
        operatividad: { acciones: [], alcance: 'NONE' },
        inventario: { acciones: [], alcance: 'NONE' },
        mantenciones: { acciones: [], alcance: 'NONE' },
        mapa: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        usuarios: { acciones: ['view'], alcance: 'GLOBAL' },
        vehiculos: { acciones: ['view'], alcance: 'GLOBAL' },
      },
      comandante: {
        inicio: { acciones: ['view'], alcance: 'GLOBAL' },
        dashboard: { acciones: ['view'], alcance: 'GLOBAL' },
        despachos: { acciones: ['view'], alcance: 'GLOBAL' },
        grifos: { acciones: ['view'], alcance: 'GLOBAL' },
        operatividad: { acciones: ['view'], alcance: 'GLOBAL' },
        inventario: { acciones: ['view'], alcance: 'GLOBAL' },
        mantenciones: { acciones: ['view'], alcance: 'GLOBAL' },
        mapa: { acciones: ['view'], alcance: 'GLOBAL' },
        usuarios: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        vehiculos: { acciones: ['view'], alcance: 'GLOBAL' },
      },
      director: {
        inicio: { acciones: ['view'], alcance: 'COMPANY' },
        dashboard: { acciones: ['view'], alcance: 'COMPANY' },
        despachos: { acciones: ['view'], alcance: 'COMPANY' },
        grifos: { acciones: ['view'], alcance: 'COMPANY' },
        operatividad: { acciones: ['view'], alcance: 'COMPANY' },
        inventario: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'COMPANY' },
        mantenciones: { acciones: ['view'], alcance: 'COMPANY' },
        mapa: { acciones: ['view'], alcance: 'COMPANY' },
        usuarios: { acciones: ['view'], alcance: 'COMPANY' },
        vehiculos: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'COMPANY' },
      },
      capitán: {
        inicio: { acciones: ['view'], alcance: 'COMPANY' },
        dashboard: { acciones: [], alcance: 'NONE' },
        despachos: { acciones: ['view'], alcance: 'COMPANY' },
        grifos: { acciones: ['view'], alcance: 'COMPANY' },
        operatividad: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'COMPANY' },
        inventario: { acciones: ['view'], alcance: 'COMPANY' },
        mantenciones: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'COMPANY' },
        mapa: { acciones: ['view'], alcance: 'COMPANY' },
        usuarios: { acciones: ['view'], alcance: 'COMPANY' },
        vehiculos: { acciones: ['view'], alcance: 'COMPANY' },
      },
      capitan: {
        inicio: { acciones: ['view'], alcance: 'COMPANY' },
        dashboard: { acciones: [], alcance: 'NONE' },
        despachos: { acciones: ['view'], alcance: 'COMPANY' },
        grifos: { acciones: ['view'], alcance: 'COMPANY' },
        operatividad: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'COMPANY' },
        inventario: { acciones: ['view'], alcance: 'COMPANY' },
        mantenciones: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'COMPANY' },
        mapa: { acciones: ['view'], alcance: 'COMPANY' },
        usuarios: { acciones: ['view'], alcance: 'COMPANY' },
        vehiculos: { acciones: ['view'], alcance: 'COMPANY' },
      },
      bombero: {
        inicio: { acciones: ['view'], alcance: 'COMPANY' },
        dashboard: { acciones: [], alcance: 'NONE' },
        despachos: { acciones: ['view'], alcance: 'PARTICIPATION' },
        grifos: { acciones: ['view'], alcance: 'COMPANY' },
        operatividad: { acciones: [], alcance: 'NONE' },
        inventario: { acciones: [], alcance: 'NONE' },
        mantenciones: { acciones: [], alcance: 'NONE' },
        mapa: { acciones: ['view'], alcance: 'COMPANY' },
        usuarios: { acciones: [], alcance: 'NONE' },
        vehiculos: { acciones: ['view'], alcance: 'COMPANY' },
      },
      mecánico: {
        inicio: { acciones: ['view'], alcance: 'COMPANY' },
        dashboard: { acciones: [], alcance: 'NONE' },
        despachos: { acciones: [], alcance: 'NONE' },
        grifos: { acciones: [], alcance: 'NONE' },
        operatividad: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'COMPANY' },
        inventario: { acciones: ['view'], alcance: 'COMPANY' },
        mantenciones: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'COMPANY' },
        mapa: { acciones: [], alcance: 'NONE' },
        usuarios: { acciones: [], alcance: 'NONE' },
        vehiculos: { acciones: ['view'], alcance: 'COMPANY' },
      },
      mecanico: {
        inicio: { acciones: ['view'], alcance: 'COMPANY' },
        dashboard: { acciones: [], alcance: 'NONE' },
        despachos: { acciones: [], alcance: 'NONE' },
        grifos: { acciones: [], alcance: 'NONE' },
        operatividad: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'COMPANY' },
        inventario: { acciones: ['view'], alcance: 'COMPANY' },
        mantenciones: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'COMPANY' },
        mapa: { acciones: [], alcance: 'NONE' },
        usuarios: { acciones: [], alcance: 'NONE' },
        vehiculos: { acciones: ['view'], alcance: 'COMPANY' },
      },
      administrador: {
        inicio: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        dashboard: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        despachos: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        grifos: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        operatividad: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        inventario: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        mantenciones: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        mapa: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        usuarios: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
        vehiculos: { acciones: ['view', 'create', 'update', 'delete'], alcance: 'GLOBAL' },
      },
    };

    const cfg = defaultsPorRol[rolNorm];
    if (!cfg) throw new BadRequestException(`No hay configuración predeterminada para el rol ${rolNorm}`);

    const matrizInput: ModuloPermisosInput[] = Object.entries(cfg).map(([mod, c]) => ({
      modulo: mod,
      ver: c.acciones.includes('view'),
      crear: c.acciones.includes('create'),
      editar: c.acciones.includes('update'),
      eliminar: c.acciones.includes('delete'),
      alcance: c.alcance as any,
    }));

    return this.guardarMatriz(idRol, matrizInput);
  }
}
