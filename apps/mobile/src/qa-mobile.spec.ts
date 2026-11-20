import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de expo-secure-store antes de importar api.ts
const secureStorageMock: Record<string, string> = {};
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (key: string) => secureStorageMock[key] ?? null),
  setItemAsync: vi.fn(async (key: string, val: string) => {
    secureStorageMock[key] = val;
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    delete secureStorageMock[key];
  }),
}));

import { distanciaEnMetros, formatearDistancia } from './utils/distancia';
import { emojiEmergencia } from './utils/emergencia';
import { esMecanico } from './utils/roles';
import { api, saveToken, getToken, clearToken } from './services/api';

describe('QA Mobile - Cálculo Geodésico Haversine (utils/distancia.ts)', () => {
  it('QA-MOB-01: Calcula distancia real en metros entre dos puntos de Talcahuano (~1.1 km)', () => {
    // Plaza de Armas Talcahuano (-36.7145, -73.1140) a sector La Poza (-36.7245, -73.1140)
    const dist = distanciaEnMetros([-36.7145, -73.114], [-36.7245, -73.114]);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1120);
  });

  it('QA-MOB-02: Formatea distancias menores a 1000 m en metros y mayores en kilómetros con 1 decimal', () => {
    expect(formatearDistancia(345.7)).toBe('346 m');
    expect(formatearDistancia(1540)).toBe('1.5 km');
  });
});

describe('QA Mobile - Clasificación de Emergencias y Reglas de Rol', () => {
  it('QA-MOB-03: Mantiene paridad visual de emojis con Web para tipos de emergencia', () => {
    expect(emojiEmergencia('10-0 Incendio Estructural')).toBe('🔥');
    expect(emojiEmergencia('10-3 Colisión vehicular')).toBe('💥');
    expect(emojiEmergencia('10-6 Fuga de gas')).toBe('☣️');
    expect(emojiEmergencia('Inundación sector costero')).toBe('🌊');
    expect(emojiEmergencia('Emergencia médica')).toBe('🚑');
    expect(emojiEmergencia('Otro llamado')).toBe('🚨');
  });

  it('QA-MOB-04: Detecta rol Mecánico con y sin tildes/mayúsculas para restringir vista de despachos', () => {
    expect(esMecanico('Mecánico')).toBe(true);
    expect(esMecanico('mecanico')).toBe(true);
    expect(esMecanico('MECÁNICO')).toBe(true);
    expect(esMecanico('Bombero')).toBe(false);
    expect(esMecanico(null)).toBe(false);
  });
});

describe('QA Mobile - Almacenamiento Seguro JWT e Interceptor Axios (services/api.ts)', () => {
  beforeEach(() => {
    Object.keys(secureStorageMock).forEach((k) => delete secureStorageMock[k]);
  });

  it('QA-MOB-05: Guarda, recupera y elimina el JWT en expo-secure-store', async () => {
    await saveToken('jwt-mobile-123');
    expect(await getToken()).toBe('jwt-mobile-123');
    await clearToken();
    expect(await getToken()).toBeNull();
  });

  it('QA-MOB-06: Interceptor de request adjunta Authorization Bearer y response 401 revoca token', async () => {
    await saveToken('jwt-activo-mobile');

    // Probar interceptor de request
    const reqHandler = (api.interceptors.request as any).handlers[0].fulfilled;
    const configResult = await reqHandler({ headers: {} });
    expect(configResult.headers.Authorization).toBe('Bearer jwt-activo-mobile');

    // Probar interceptor de response ante 401
    const resRejected = (api.interceptors.response as any).handlers[0].rejected;
    await expect(resRejected({ response: { status: 401 } })).rejects.toBeDefined();
    expect(await getToken()).toBeNull();
  });
});
