// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost:5173" }
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { emojiEmergencia, normalizarCoordenadas } from './utils/emergencia';
import { obtenerEtiquetaRol, NAV_ITEMS } from './config/navigation';
import { apiClient, ApiError } from './services/apiClient';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AuthContext } from './context/auth-context';

describe('QA Web - Utilidades Geoespaciales y Emergencias (emergencia.ts)', () => {
  it('QA-WEB-01: Normaliza coordenadas invertidas [lng, lat] de PostGIS a [lat, lng] para Talcahuano', () => {
    expect(normalizarCoordenadas([-73.116, -36.714])).toEqual([-36.714, -73.116]);
    expect(normalizarCoordenadas({ type: 'Point', coordinates: [-73.116, -36.714] })).toEqual([-36.714, -73.116]);
  });

  it('QA-WEB-02: Mantiene coordenadas válidas [lat, lng] y rechaza entradas nulas/inválidas', () => {
    expect(normalizarCoordenadas([-36.714, -73.116])).toEqual([-36.714, -73.116]);
    expect(normalizarCoordenadas(null)).toBeNull();
    expect(normalizarCoordenadas(['abc', 'def'])).toBeNull();
  });

  it('QA-WEB-03: Clasifica correctamente claves de emergencia (10-0 a 10-8) con emoji esperado', () => {
    expect(emojiEmergencia('10-0 (Incendio Estructural)')).toBe('🔥');
    expect(emojiEmergencia('10-3 (Rescate Vehicular / Accidente)')).toBe('💥');
    expect(emojiEmergencia('10-6 (Fuga de Gas)')).toBe('☣️');
    expect(emojiEmergencia('10-7 (Eléctrico / Transformador)')).toBe('⚡');
    expect(emojiEmergencia('Clave desconocida')).toBe('🚨');
  });
});

describe('QA Web - Navegación y Etiquetas de Rol (navigation.ts)', () => {
  it('QA-WEB-04: Resuelve etiquetas legibles para todos los roles operativos (con y sin tildes)', () => {
    expect(obtenerEtiquetaRol('administrador')).toBe('Administrador');
    expect(obtenerEtiquetaRol('capitan')).toBe('Capitán / Comandancia');
    expect(obtenerEtiquetaRol('capitán')).toBe('Capitán / Comandancia');
    expect(obtenerEtiquetaRol('mecanico')).toBe('Mecánico');
    expect(obtenerEtiquetaRol('central')).toBe('Central de Despacho');
  });

  it('QA-WEB-05: Define las 12 rutas operativas del menú con sus módulos RBAC', () => {
    expect(NAV_ITEMS.length).toBe(12);
    const permisosItem = NAV_ITEMS.find((i) => i.path === '/permisos');
    expect(permisosItem?.roles).toEqual(['administrador']);
  });
});

describe('QA Web - Cliente HTTP e Interceptor JWT (apiClient.ts)', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = String(v); },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      },
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it('QA-WEB-06: Adjunta automáticamente el Bearer token desde localStorage', async () => {
    localStorage.setItem('accessToken', 'jwt-token-prueba');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ status: 'ok' }),
    } as Response);

    const res = await apiClient.get<{ status: string }>('/vehiculos');
    expect(res.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/vehiculos'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token-prueba',
        }),
      }),
    );
  });

  it('QA-WEB-07: Ante respuesta HTTP 401 limpia accessToken y lanza ApiError con mensaje de NestJS', async () => {
    localStorage.setItem('accessToken', 'token-expirado');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: ['Token expirado o inválido'] }),
    } as Response);

    await expect(apiClient.get('/mantenciones')).rejects.toThrow(ApiError);
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});

describe('QA Web - Protección de Rutas RBAC (ProtectedRoute.tsx)', () => {
  const renderRutaProtegida = (userMock: any, hasPermissionMock = () => false) => {
    return render(
      <AuthContext.Provider
        value={{
          user: userMock,
          token: userMock ? 'tok' : null,
          isAuthenticated: Boolean(userMock),
          isLoading: false,
          login: vi.fn(),
          logout: vi.fn(),
          hasPermission: hasPermissionMock,
          tienePermiso: vi.fn(() => false),
          refrescarPerfil: vi.fn(),
        } as any}
      >
        <MemoryRouter initialEntries={['/usuarios']}>
          <Routes>
            <Route path="/login" element={<div>Pantalla Login</div>} />
            <Route path="/" element={<div>Inicio Redirigido</div>} />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute modulo="usuarios">
                  <div>Vista Usuarios Protegida</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );
  };

  it('QA-WEB-08: Redirige a /login si el usuario no está autenticado', () => {
    renderRutaProtegida(null);
    expect(screen.getByText('Pantalla Login')).toBeTruthy();
  });

  it('QA-WEB-09: Permite acceso total al rol Administrador', () => {
    renderRutaProtegida({ id: 1, rol: 'administrador' }, () => false);
    expect(screen.getByText('Vista Usuarios Protegida')).toBeTruthy();
  });

  it('QA-WEB-10: Bloquea y redirige a / si un rol sin permiso intenta acceder a /usuarios', () => {
    renderRutaProtegida({ id: 5, rol: 'bombero' }, () => false);
    expect(screen.getByText('Inicio Redirigido')).toBeTruthy();
  });
});
