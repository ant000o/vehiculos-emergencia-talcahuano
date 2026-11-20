export interface Rol {
  id_rol: number;
  nombre_rol: string;
  descripcion: string | null;
}

export interface Compania {
  id_compania: number;
  numero_compania: number;
  nombre: string;
}

export interface Usuario {
  id_usuario: number;
  rut: string;
  nombre: string;
  apellidos: string;
  email: string;
  id_rol: number;
  rol: Rol;
  id_compania: number;
  compania: Compania;
  estado_activo: boolean;
}

// Usuario que devuelven POST /auth/login y GET /auth/me (backend con RBAC).
export interface UsuarioSesion {
  id_usuario: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  compania: string;
  id_rol?: number;
  id_compania?: number;
  permisos?: string[];
  alcances?: Record<string, string>;
}

export interface LoginResponse {
  access_token: string;
  usuario: UsuarioSesion;
}
