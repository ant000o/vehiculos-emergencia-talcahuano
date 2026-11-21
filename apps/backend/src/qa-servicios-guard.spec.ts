import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, BadRequestException, NotFoundException, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';
import { RolesGuard } from './auth/guards/roles.guard';
import { MantencionService } from './mantencion/mantencion.service';
import { MovimientoInventarioService } from './movimiento_inventario/movimiento_inventario.service';
import { EstadoMantencion, EstadoVehiculo, TipoMantencion, TipoMovimiento } from './common/enums/estados.enum';

function crearContextoHttp(req: Record<string, any> = {}): ExecutionContext {
  return {
    getHandler: () => (() => {}),
    getClass: () => (class DummyController {}),
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('QA Unitario con Mocks - RolesGuard, MantencionService y MovimientoInventarioService', () => {
  describe('RolesGuard', () => {
    let reflector: Reflector;
    let rbacService: { isSuperAdmin: ReturnType<typeof vi.fn>; checkAccess: ReturnType<typeof vi.fn> };
    let guard: RolesGuard;

    beforeEach(() => {
      reflector = new Reflector();
      rbacService = {
        isSuperAdmin: vi.fn().mockResolvedValue(false),
        checkAccess: vi.fn(),
      };
      guard = new RolesGuard(reflector, rbacService as any);
    });

    it('QA-UNIT-GUARD-01: Permite acceso si la ruta no define @RequirePermission ni @Roles', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const ctx = crearContextoHttp({});
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('QA-UNIT-GUARD-02: Lanza ForbiddenException si falta request.user en ruta protegida', async () => {
      vi.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce({ modulo: 'mantenciones', accion: 'view' })
        .mockReturnValueOnce(undefined);
      const ctx = crearContextoHttp({ user: undefined });
      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });

    it('QA-UNIT-GUARD-03: Asigna alcance GLOBAL y permite paso a superadministrador', async () => {
      vi.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce({ modulo: 'mantenciones', accion: 'delete' })
        .mockReturnValueOnce(undefined);
      rbacService.isSuperAdmin.mockResolvedValue(true);
      const req: Record<string, any> = { user: { sub: 1, email: 'admin@test.cl' } };

      await expect(guard.canActivate(crearContextoHttp(req))).resolves.toBe(true);
      expect(req.rbacScope).toBe('GLOBAL');
      expect(rbacService.checkAccess).not.toHaveBeenCalled();
    });

    it('QA-UNIT-GUARD-04: Bloquea con ForbiddenException si checkAccess deniega o devuelve alcance NONE', async () => {
      vi.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce({ modulo: 'permisos', accion: 'update' })
        .mockReturnValueOnce(undefined);
      rbacService.checkAccess.mockResolvedValue({ autorizado: false, alcance: 'NONE', motivo: 'Sin permiso' });
      const req: Record<string, any> = { user: { sub: 5 } };

      await expect(guard.canActivate(crearContextoHttp(req))).rejects.toThrow(ForbiddenException);
    });

    it('QA-UNIT-GUARD-05: Adjunta request.rbacScope cuando checkAccess autoriza con alcance COMPANY', async () => {
      vi.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce({ modulo: 'mantenciones', accion: 'view' })
        .mockReturnValueOnce(undefined);
      rbacService.checkAccess.mockResolvedValue({ autorizado: true, alcance: 'COMPANY' });
      const req: Record<string, any> = { user: { sub: 7, id_compania: 11 } };

      await expect(guard.canActivate(crearContextoHttp(req))).resolves.toBe(true);
      expect(req.rbacScope).toBe('COMPANY');
    });

    it('QA-UNIT-GUARD-06: Fallback @Roles acepta equivalencia capitan/comandante y asigna alcance GLOBAL', async () => {
      vi.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(['capitan']);
      const req: Record<string, any> = { user: { sub: 9, nombre_rol: 'Comandante' } };

      await expect(guard.canActivate(crearContextoHttp(req))).resolves.toBe(true);
      expect(req.rbacScope).toBe('GLOBAL');
    });
  });

  describe('MantencionService', () => {
    let repo: { create: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
    let vehiculoRepo: { findOne: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    let gateway: { emitAlertaFallaGrave: ReturnType<typeof vi.fn> };
    let service: MantencionService;

    beforeEach(() => {
      repo = {
        create: vi.fn((d) => ({ ...d })),
        save: vi.fn(async (d) => ({ id_mantencion: 101, ...d })),
      };
      vehiculoRepo = {
        findOne: vi.fn(),
        update: vi.fn().mockResolvedValue({ affected: 1 }),
      };
      gateway = {
        emitAlertaFallaGrave: vi.fn(),
      };
      service = new MantencionService(repo as any, vehiculoRepo as any, gateway as any);
    });

    it('QA-UNIT-MANT-01: Rechaza con BadRequestException si se envían mecánico y taller externo a la vez', async () => {
      await expect(
        service.create({
          id_vehiculo: 1,
          tipo_mantencion: TipoMantencion.PREVENTIVA,
          id_usuario_mecanico: 4,
          taller_externo: 'Taller Sur',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('QA-UNIT-MANT-02: Rechaza con BadRequestException si no se envía ni mecánico ni taller externo', async () => {
      await expect(
        service.create({
          id_vehiculo: 1,
          tipo_mantencion: TipoMantencion.PREVENTIVA,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('QA-UNIT-MANT-03: Lanza NotFoundException si el vehículo indicado no existe', async () => {
      vehiculoRepo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.create({
          id_vehiculo: 9999,
          tipo_mantencion: TipoMantencion.REVISION,
          taller_externo: 'Taller Central',
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('QA-UNIT-MANT-04: Convierte QueryFailedError 23503 en BadRequestException', async () => {
      vehiculoRepo.findOne.mockResolvedValueOnce({ id_vehiculo: 1, kilometraje: 10000 });
      const fkErr = Object.assign(new QueryFailedError('INSERT', [], new Error('fk')), { code: '23503' });
      repo.save.mockRejectedValueOnce(fkErr);

      await expect(
        service.create({
          id_vehiculo: 1,
          tipo_mantencion: TipoMantencion.PREVENTIVA,
          taller_externo: 'Taller Central',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('QA-UNIT-MANT-05: Actualiza odómetro si es mayor y emite alerta si tipo es EMERGENCIA', async () => {
      vehiculoRepo.findOne
        .mockResolvedValueOnce({ id_vehiculo: 2, patente: 'BB-1234', kilometraje: 40000 })
        .mockResolvedValueOnce({ id_vehiculo: 2, patente: 'BB-1234', kilometraje: 40000 })
        .mockResolvedValueOnce({ id_vehiculo: 2, patente: 'BB-1234', kilometraje: 45000, estado_operativo: EstadoVehiculo.FUERA_DE_SERVICIO });

      const res = await service.create({
        id_vehiculo: 2,
        tipo_mantencion: TipoMantencion.EMERGENCIA,
        kilometraje: 45000,
        descripcion_falla: 'Fuga bomba principal',
        taller_externo: 'Maestranza Talcahuano',
      } as any);

      expect(res.id_mantencion).toBe(101);
      expect(vehiculoRepo.update).toHaveBeenCalledWith(2, { kilometraje: 45000 });
      expect(vehiculoRepo.update).toHaveBeenCalledWith(2, { estado_operativo: EstadoVehiculo.FUERA_DE_SERVICIO });
      expect(gateway.emitAlertaFallaGrave).toHaveBeenCalledTimes(1);
    });
  });

  describe('MovimientoInventarioService', () => {
    let repo: { find: ReturnType<typeof vi.fn>; findOne: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
    let service: MovimientoInventarioService;

    beforeEach(() => {
      repo = {
        find: vi.fn().mockResolvedValue([]),
        findOne: vi.fn(),
        create: vi.fn((d) => ({ ...d })),
        save: vi.fn(async (d) => ({ id_movimiento: 55, ...d })),
      };
      service = new MovimientoInventarioService(repo as any);
    });

    it('QA-UNIT-INV-01: findAll aplica filtro por id_compania cuando se entrega alcance COMPANY', async () => {
      await service.findAll(11);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { articulo: { id_compania: 11 } },
        }),
      );
    });

    it('QA-UNIT-INV-02: findOne lanza NotFoundException cuando el movimiento no existe', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne(777)).rejects.toThrow(NotFoundException);
    });

    it('QA-UNIT-INV-03: create asigna fecha_movimiento y guarda el movimiento', async () => {
      const saved = await service.create({
        id_articulo: 3,
        tipo_movimiento: TipoMovimiento.ENTRADA,
        cantidad: 5,
      } as any);
      expect(saved.id_movimiento).toBe(55);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id_articulo: 3,
          cantidad: 5,
          fecha_movimiento: expect.any(Date),
        }),
      );
    });
  });
});
