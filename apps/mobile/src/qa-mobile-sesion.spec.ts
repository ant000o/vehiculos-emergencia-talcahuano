import { describe, it, expect, vi, beforeEach } from 'vitest';

const secureStoreData: Record<string, string> = {};
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (k: string) => secureStoreData[k] ?? null),
  setItemAsync: vi.fn(async (k: string, v: string) => {
    secureStoreData[k] = v;
  }),
  deleteItemAsync: vi.fn(async (k: string) => {
    delete secureStoreData[k];
  }),
}));

import { api, saveToken, getToken } from './services/api';
import { login, obtenerPerfil } from './services/auth.service';

describe('P8-MOB-SESION: Servicio de Autenticación y Resiliencia ante Errores de Red en Móvil', () => {
  beforeEach(() => {
    Object.keys(secureStoreData).forEach((k) => delete secureStoreData[k]);
    vi.restoreAllMocks();
  });

  it('P8-MOB-01: login() y obtenerPerfil() invocan los endpoints esperados de auth.service', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        access_token: 'token-movil-valido',
        usuario: { id_usuario: 19, email: 'bombero@test.cl', rol: 'Bombero', permisos: [] },
      },
    } as any);

    const resLogin = await login('bombero@test.cl', 'Secreta123');
    expect(postSpy).toHaveBeenCalledWith('/auth/login', {
      email: 'bombero@test.cl',
      password: 'Secreta123',
    });
    expect(resLogin.access_token).toBe('token-movil-valido');

    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { id_usuario: 19, email: 'bombero@test.cl', rol: 'Bombero', permisos: [] },
    } as any);

    const perfil = await obtenerPerfil();
    expect(getSpy).toHaveBeenCalledWith('/auth/me', { timeout: 30000 });
    expect(perfil.id_usuario).toBe(19);
  });

  it('P8-MOB-02: Ante error de red sin HTTP 401 conserva el token; ante 401 lo revoca', async () => {
    await saveToken('token-resiliente');
    const resRejected = (api.interceptors.response as any).handlers[0].rejected;

    await expect(resRejected(new Error('Network Error'))).rejects.toThrow('Network Error');
    expect(await getToken()).toBe('token-resiliente');

    await expect(resRejected({ response: { status: 401 } })).rejects.toBeDefined();
    expect(await getToken()).toBeNull();
  });
});
