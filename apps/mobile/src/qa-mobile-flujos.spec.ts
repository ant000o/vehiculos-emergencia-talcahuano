import { describe, it, expect } from 'vitest';
import {
  puedeFinalizarDespacho,
  perteneceATripulacion,
  ETIQUETA_ESTADO,
} from './utils/despachos';
import { emojiEmergencia } from './utils/emergencia';
import { EstadoEmergencia, DespachoEmergencia } from './types/despacho';
import { UsuarioSesion } from './types/auth';

describe('P6-MOB: Lógica Operativa de Despachos y Emergencias en Aplicación Móvil', () => {
  it('P6-MOB-01: puedeFinalizarDespacho valida permisos modernos, legacy y sesión nula', () => {
    expect(puedeFinalizarDespacho(null)).toBe(false);
    expect(puedeFinalizarDespacho(undefined)).toBe(false);
    expect(
      puedeFinalizarDespacho({ id_usuario: 1, permisos: ['vehiculos.view'] } as unknown as UsuarioSesion),
    ).toBe(false);
    expect(
      puedeFinalizarDespacho({ id_usuario: 2, permisos: ['despachos.update'] } as unknown as UsuarioSesion),
    ).toBe(true);
    expect(
      puedeFinalizarDespacho({ id_usuario: 3, permisos: ['despacho.gestionar'] } as unknown as UsuarioSesion),
    ).toBe(true);
  });

  it('P6-MOB-02: perteneceATripulacion verifica asignación por id_usuario y maneja listas vacías', () => {
    const despachoSinTripulacion = { id_despacho: 10 } as unknown as DespachoEmergencia;
    expect(
      perteneceATripulacion(despachoSinTripulacion, { id_usuario: 5 } as unknown as UsuarioSesion),
    ).toBe(false);

    const despachoConTripulacion = {
      id_despacho: 11,
      tripulacion: [{ id_usuario: 5 }, { id_usuario: 9 }],
    } as unknown as DespachoEmergencia;

    expect(
      perteneceATripulacion(despachoConTripulacion, { id_usuario: 5 } as unknown as UsuarioSesion),
    ).toBe(true);
    expect(
      perteneceATripulacion(despachoConTripulacion, { id_usuario: 99 } as unknown as UsuarioSesion),
    ).toBe(false);
    expect(perteneceATripulacion(despachoConTripulacion, null)).toBe(false);
  });

  it('P6-MOB-03: ETIQUETA_ESTADO y emojiEmergencia cubren estados, tildes, casos nulos y textos largos', () => {
    expect(ETIQUETA_ESTADO[EstadoEmergencia.EN_CURSO]).toBe('EN CURSO');
    expect(ETIQUETA_ESTADO[EstadoEmergencia.CONTROLADA]).toBe('CONTROLADA');
    expect(ETIQUETA_ESTADO[EstadoEmergencia.FINALIZADA]).toBe('FINALIZADA');
    expect(ETIQUETA_ESTADO[EstadoEmergencia.CANCELADA]).toBe('CANCELADA');

    expect(emojiEmergencia('Incendio Estructural')).toBe('🔥');
    expect(emojiEmergencia('Fuga de Gas en vivienda')).toBe('☣️');
    expect(emojiEmergencia('Colisión vehicular múltiple')).toBe('💥');
    expect(emojiEmergencia('Rescate de persona atrapada')).toBe('🆘');
    expect(emojiEmergencia('Inundación en sector costero')).toBe('🌊');
    expect(emojiEmergencia('')).toBe('🚨');
    expect(emojiEmergencia(null)).toBe('🚨');
    expect(emojiEmergencia('A'.repeat(80))).toBe('🚨');
  });
});
