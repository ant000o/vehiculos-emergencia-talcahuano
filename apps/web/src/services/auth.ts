export interface LoginCredentials {
  email: string;
  password: string;
}

export type Rol = 'administrador' | 'mecanico' | 'comandancia' | 'bombero';

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const MOCK_DELAY_MS = 600;
const MOCK_PASSWORD = 'demo1234';

// Un usuario de prueba por rol, para poder ver cómo cambia la navegación
// según quién inicia sesión. Todos comparten la misma contraseña.
const MOCK_USERS: Record<string, AuthUser> = {
  'demo@bomberostalcahuano.cl': {
    id: 'mock-admin',
    nombre: 'Antonia Soto (Admin)',
    email: 'demo@bomberostalcahuano.cl',
    rol: 'administrador',
  },
  'mecanico@bomberostalcahuano.cl': {
    id: 'mock-mecanico',
    nombre: 'Pedro Ruiz (Mecánico)',
    email: 'mecanico@bomberostalcahuano.cl',
    rol: 'mecanico',
  },
  'comandancia@bomberostalcahuano.cl': {
    id: 'mock-comandancia',
    nombre: 'Capitán Rojas',
    email: 'comandancia@bomberostalcahuano.cl',
    rol: 'comandancia',
  },
  'bombero@bomberostalcahuano.cl': {
    id: 'mock-bombero',
    nombre: 'Juan Pérez (Conductor)',
    email: 'bombero@bomberostalcahuano.cl',
    rol: 'bombero',
  },
};

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const email = credentials.email.trim().toLowerCase();
  const user = MOCK_USERS[email];
  const esValido = user !== undefined && credentials.password === MOCK_PASSWORD;

  if (!esValido) {
    await delay(null, MOCK_DELAY_MS);
    throw new Error('Correo o contraseña incorrectos.');
  }

  return delay({ user, accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });
}

export function logout(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
