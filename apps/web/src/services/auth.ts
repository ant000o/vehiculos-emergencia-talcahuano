/**
 * Servicio de autenticación.
 *
 * ⚠️ MOCK temporal: simula la respuesta del backend mientras Carlo define
 * y construye el endpoint real (POST /auth/login con JWT + refresh token).
 *
 * Para conectar con el backend real más adelante, solo se reemplaza el
 * cuerpo de `login()` por la llamada HTTP real (fetch/axios a VITE_API_URL).
 * Las vistas que consumen este servicio (LoginPage, AuthContext) no deberían
 * necesitar cambios.
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: 'bombero' | 'mecanico' | 'comandancia' | 'administrador';
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const MOCK_DELAY_MS = 600;

// Usuario de prueba mientras no existe backend real.
// Credenciales: demo@bomberostalcahuano.cl / demo1234
const MOCK_USER: AuthUser = {
  id: 'mock-1',
  nombre: 'Usuario Demo',
  email: 'demo@bomberostalcahuano.cl',
  rol: 'bombero',
};

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const emailValido = credentials.email.trim().toLowerCase();
  const esCredencialDemo =
    emailValido === MOCK_USER.email && credentials.password === 'demo1234';

  if (!esCredencialDemo) {
    // Simula el mismo formato de error que devolverá NestJS (401).
    await delay(null, MOCK_DELAY_MS);
    throw new Error('Correo o contraseña incorrectos.');
  }

  return delay({
    user: MOCK_USER,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  });
}

export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
