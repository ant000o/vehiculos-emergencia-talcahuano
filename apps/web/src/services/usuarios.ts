/**
 * Servicio de gestión de usuarios (HU-02).
 *
 * ⚠️ MOCK temporal: simula lo que hará el backend real de Carlo.
 * Los nombres de campo (rut, id_rol, id_compania, estado_activo) siguen
 * EXACTAMENTE el ERD ya finalizado, para que conectar después sea solo
 * reemplazar el interior de estas funciones — igual que se hizo con auth.ts.
 */

export interface RolOption {
  id_rol: number;
  nombre_rol: string;
}

export interface CompaniaOption {
  id_compania: number;
  nombre: string;
}

export interface Usuario {
  id_usuario: number;
  rut: string;
  nombre: string;
  apellidos: string;
  email: string;
  id_rol: number;
  id_compania: number;
  estado_activo: boolean;
}

export interface CrearUsuarioInput {
  rut: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  id_rol: number;
  id_compania: number;
}

export type EditarUsuarioInput = Omit<CrearUsuarioInput, 'password'>;

const MOCK_DELAY_MS = 500;

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// --- Datos de referencia (tablas rol y compania del ERD) ---

const ROLES: RolOption[] = [
  { id_rol: 1, nombre_rol: 'Administrador' },
  { id_rol: 2, nombre_rol: 'Mecánico' },
  { id_rol: 3, nombre_rol: 'Comandancia' },
  { id_rol: 4, nombre_rol: 'Bombero / Conductor' },
];

const COMPANIAS: CompaniaOption[] = [
  { id_compania: 1, nombre: 'Primera Compañía "Bomba Talcahuano"' },
  { id_compania: 2, nombre: 'Segunda Compañía "Bomba Hualpén"' },
  { id_compania: 3, nombre: 'Tercera Compañía "Bomba Tumbes"' },
];

// --- "Base de datos" en memoria, se reinicia al recargar la página ---

let usuarios: Usuario[] = [
  {
    id_usuario: 1,
    rut: '18.123.456-7',
    nombre: 'Antonia',
    apellidos: 'Soto Pérez',
    email: 'demo@bomberostalcahuano.cl',
    id_rol: 1,
    id_compania: 1,
    estado_activo: true,
  },
  {
    id_usuario: 2,
    rut: '17.987.654-3',
    nombre: 'Pedro',
    apellidos: 'Ruiz Vega',
    email: 'mecanico@bomberostalcahuano.cl',
    id_rol: 2,
    id_compania: 1,
    estado_activo: true,
  },
  {
    id_usuario: 3,
    rut: '16.555.222-1',
    nombre: 'Juan',
    apellidos: 'Pérez López',
    email: 'bombero@bomberostalcahuano.cl',
    id_rol: 4,
    id_compania: 2,
    estado_activo: false,
  },
];

let nextId = 4;

export async function listarRoles(): Promise<RolOption[]> {
  return delay(ROLES, 200);
}

export async function listarCompanias(): Promise<CompaniaOption[]> {
  return delay(COMPANIAS, 200);
}

export async function listarUsuarios(): Promise<Usuario[]> {
  return delay([...usuarios]);
}

export async function crearUsuario(input: CrearUsuarioInput): Promise<Usuario> {
  const emailDuplicado = usuarios.some(
    (u) => u.email.toLowerCase() === input.email.toLowerCase(),
  );
  if (emailDuplicado) {
    await delay(null, MOCK_DELAY_MS);
    throw new Error('Ya existe un usuario con ese correo.');
  }

  const nuevo: Usuario = {
    id_usuario: nextId++,
    rut: input.rut,
    nombre: input.nombre,
    apellidos: input.apellidos,
    email: input.email,
    id_rol: input.id_rol,
    id_compania: input.id_compania,
    estado_activo: true,
  };
  usuarios = [...usuarios, nuevo];
  return delay(nuevo);
}

export async function editarUsuario(
  id_usuario: number,
  input: EditarUsuarioInput,
): Promise<Usuario> {
  const existente = usuarios.find((u) => u.id_usuario === id_usuario);
  if (!existente) {
    await delay(null, MOCK_DELAY_MS);
    throw new Error('El usuario no existe.');
  }

  const actualizado: Usuario = { ...existente, ...input };
  usuarios = usuarios.map((u) => (u.id_usuario === id_usuario ? actualizado : u));
  return delay(actualizado);
}

export async function cambiarEstadoUsuario(
  id_usuario: number,
  estado_activo: boolean,
): Promise<Usuario> {
  const existente = usuarios.find((u) => u.id_usuario === id_usuario);
  if (!existente) {
    await delay(null, MOCK_DELAY_MS);
    throw new Error('El usuario no existe.');
  }
  const actualizado = { ...existente, estado_activo };
  usuarios = usuarios.map((u) => (u.id_usuario === id_usuario ? actualizado : u));
  return delay(actualizado);
}
