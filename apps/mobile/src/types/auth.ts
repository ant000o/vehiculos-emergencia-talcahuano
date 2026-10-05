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

export interface LoginResponse {
  access_token: string;
  usuario: {
    id_usuario: number;
    nombre: string;
    apellidos: string;
    email: string;
    rol: string;
    compania: string;
  };
}