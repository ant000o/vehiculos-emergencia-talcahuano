import { describe, it, expect } from 'vitest';
import {
  esMecanico,
  puedeVerMantenciones,
  puedeGestionarMantenciones,
  puedeActualizarGrifos,
  puedeRegistrarRevision,
  puedeVerInventario,
  puedeVerPersonal,
  puedeEditarPersonal,
} from './utils/roles';

describe('QA Mobile - Matriz RBAC Completa de los 7 Roles Institucionales (utils/roles.ts)', () => {
  it('QA-MOB-07: Valida permisos de visualización y gestión de Mantenciones por rol', () => {
    expect(puedeVerMantenciones('Administrador')).toBe(true);
    expect(puedeVerMantenciones('Comandante')).toBe(true);
    expect(puedeVerMantenciones('Director')).toBe(true);
    expect(puedeVerMantenciones('Capitán')).toBe(true);
    expect(puedeVerMantenciones('Mecánico')).toBe(true);
    expect(puedeVerMantenciones('Bombero')).toBe(false);
    expect(puedeVerMantenciones('Central de Alarmas')).toBe(false);

    expect(puedeGestionarMantenciones('Administrador')).toBe(true);
    expect(puedeGestionarMantenciones('Capitán')).toBe(true);
    expect(puedeGestionarMantenciones('Mecánico')).toBe(true);
    expect(puedeGestionarMantenciones('Comandante')).toBe(false);
    expect(puedeGestionarMantenciones('Director')).toBe(false);
  });

  it('QA-MOB-08: Valida permisos operativos de Grifos y Revisiones de Estado', () => {
    expect(puedeActualizarGrifos('Administrador')).toBe(true);
    expect(puedeActualizarGrifos('Capitán')).toBe(true);
    expect(puedeActualizarGrifos('Bombero')).toBe(true);
    expect(puedeActualizarGrifos('Mecánico')).toBe(false);
    expect(puedeActualizarGrifos('Central de Alarmas')).toBe(false);

    expect(puedeRegistrarRevision('Administrador')).toBe(true);
    expect(puedeRegistrarRevision('Capitán')).toBe(true);
    expect(puedeRegistrarRevision('Mecánico')).toBe(true);
    expect(puedeRegistrarRevision('Bombero')).toBe(false);
  });

  it('QA-MOB-09: Valida permisos de Inventario y Administración de Personal', () => {
    expect(puedeVerInventario('Mecánico')).toBe(true);
    expect(puedeVerInventario('Director')).toBe(true);
    expect(puedeVerInventario('Bombero')).toBe(false);
    expect(puedeVerInventario('Central de Alarmas')).toBe(false);

    expect(puedeVerPersonal('Administrador')).toBe(true);
    expect(puedeVerPersonal('Comandante')).toBe(true);
    expect(puedeVerPersonal('Director')).toBe(true);
    expect(puedeVerPersonal('Capitán')).toBe(true);
    expect(puedeVerPersonal('Mecánico')).toBe(false);
    expect(puedeVerPersonal('Bombero')).toBe(false);

    expect(puedeEditarPersonal('Administrador')).toBe(true);
    expect(puedeEditarPersonal('Comandante')).toBe(true);
    expect(puedeEditarPersonal('Director')).toBe(false);
    expect(puedeEditarPersonal('Capitán')).toBe(false);
  });

  it('QA-MOB-10: Tolera entradas nulas, indefinidas y variaciones de mayúsculas/tildes', () => {
    expect(esMecanico(null)).toBe(false);
    expect(esMecanico(undefined)).toBe(false);
    expect(esMecanico('MECANICO')).toBe(true);
    expect(puedeActualizarGrifos('CAPITAN')).toBe(true);
    expect(puedeVerPersonal('')).toBe(false);
  });
});
