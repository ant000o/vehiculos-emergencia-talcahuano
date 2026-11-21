import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RbacService } from './auth/services/rbac.service';
import { VehiculoService } from './vehiculo/vehiculo.service';
import { EstadoVehiculo } from './common/enums/estados.enum';

describe('QA Unitario con Mocks - RbacService y VehiculoService', () => {
  describe('RbacService', () => {
    let dataSource: { query: ReturnType<typeof vi.fn> };
    let service: RbacService;

    beforeEach(() => {
      dataSource = {
        query: vi.fn(),
      };
      service = new RbacService(dataSource as any);
    });

    it('QA-UNIT-RBAC-01: isSuperAdmin retorna false si user es nulo o indefinido', async () => {
      await expect(service.isSuperAdmin(null as any)).resolves.toBe(false);
      expect(dataSource.query).not.toHaveBeenCalled();
    });

    it('QA-UNIT-RBAC-02: isSuperAdmin retorna true por nombre_rol en token sin consultar BD', async () => {
      await expect(
        service.isSuperAdmin({ sub: 1, nombre_rol: 'Administrador' } as any),
      ).resolves.toBe(true);
      expect(dataSource.query).not.toHaveBeenCalled();
    });

    it('QA-UNIT-RBAC-03: isSuperAdmin consulta BD cuando token no trae rol admin y maneja error SQL sin caer', async () => {
      dataSource.query.mockResolvedValueOnce([{ nombre_rol: 'administrador' }]);
      await expect(service.isSuperAdmin({ sub: 2, id_rol: 7, nombre_rol: 'Bombero' } as any)).resolves.toBe(true);

      dataSource.query.mockRejectedValueOnce(new Error('DB connection lost'));
      await expect(service.isSuperAdmin({ sub: 3, id_rol: 8, nombre_rol: 'Bombero' } as any)).resolves.toBe(false);
    });

    it('QA-UNIT-RBAC-04: getPermissionsForRole normaliza alcances, usa caché y respeta invalidateCache', async () => {
      dataSource.query.mockResolvedValueOnce([
        { codigo: 'vehiculos.view', modulo: 'vehiculos', alcance: 'TODAS_COMPANIAS' },
        { codigo: 'despachos.view', modulo: 'despachos', alcance: 'PARTICIPATION' },
        { codigo: 'permisos.view', modulo: 'permisos', alcance: 'NONE' },
      ]);

      const first = await service.getPermissionsForRole(10);
      expect(first.alcancesPorModulo.get('vehiculos')).toBe('GLOBAL');
      expect(first.alcancesPorModulo.get('despachos')).toBe('PARTICIPATION');
      expect(first.alcancesPorModulo.get('permisos')).toBe('NONE');
      expect(dataSource.query).toHaveBeenCalledTimes(1);

      // Segunda llamada dentro del TTL debe usar caché
      await service.getPermissionsForRole(10);
      expect(dataSource.query).toHaveBeenCalledTimes(1);

      // Invalidar rol fuerza nueva consulta a BD
      service.invalidateCache(10);
      dataSource.query.mockResolvedValueOnce([]);
      await service.getPermissionsForRole(10);
      expect(dataSource.query).toHaveBeenCalledTimes(2);
    });

    it('QA-UNIT-RBAC-05: checkAccess rechaza sin rol, bloquea alcance NONE y autoriza con alcance válido', async () => {
      await expect(service.checkAccess({ sub: 4 } as any, 'vehiculos', 'view')).resolves.toEqual(
        expect.objectContaining({ autorizado: false, alcance: 'NONE' }),
      );

      dataSource.query.mockResolvedValue([
        { codigo: 'permisos.view', modulo: 'permisos', alcance: 'NONE' },
        { codigo: 'vehiculos.view', modulo: 'vehiculos', alcance: 'COMPANY' },
      ]);

      await expect(
        service.checkAccess({ sub: 5, id_rol: 20, nombre_rol: 'Bombero' } as any, 'permisos', 'view'),
      ).resolves.toEqual(expect.objectContaining({ autorizado: false, alcance: 'NONE' }));

      await expect(
        service.checkAccess({ sub: 5, id_rol: 20, nombre_rol: 'Bombero' } as any, 'vehiculos', 'view'),
      ).resolves.toEqual({ autorizado: true, alcance: 'COMPANY' });
    });
  });

  describe('VehiculoService', () => {
    let repo: { findAndCount: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn> };
    let gateway: { emitAlertaFallaGrave: ReturnType<typeof vi.fn> };
    let mantencionService: Record<string, any>;
    let service: VehiculoService;

    beforeEach(() => {
      repo = {
        findAndCount: vi.fn().mockResolvedValue([[], 0]),
        create: vi.fn((d) => ({ ...d })),
        save: vi.fn(async (d) => ({ id_vehiculo: 1, ...d })),
        query: vi.fn().mockResolvedValue([]),
      };
      gateway = { emitAlertaFallaGrave: vi.fn() };
      mantencionService = {};
      service = new VehiculoService(repo as any, gateway as any, mantencionService as any);
    });

    it('QA-UNIT-VEH-01: findAll normaliza page negativa/cero y limita limit máximo a 100', async () => {
      await service.findAll({ page: -5, limit: 500, estado: EstadoVehiculo.OPERATIVO });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 100,
        }),
      );
    });
  });
});
