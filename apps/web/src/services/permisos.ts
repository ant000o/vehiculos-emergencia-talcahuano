import { apiClient } from './apiClient';

export interface PermisoItem {
  id_permiso: number;
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion?: string | null;
  activo: boolean;
}

export interface RolItem {
  id_rol: number;
  nombre_rol: string;
  descripcion?: string | null;
}

export interface VistaRolPermiso {
  id_rol: number;
  nombre_rol: string;
  id_permiso: number | null;
  codigo: string | null;
  nombre_permiso: string | null;
  modulo: string | null;
  descripcion: string | null;
  activo: boolean | null;
  alcance: 'GLOBAL' | 'COMPANY' | 'PARTICIPATION' | 'NONE' | 'propia_compania' | 'todas_companias' | null;
  fecha_asignacion: string | null;
}

export interface ModuloPermisosConfig {
  modulo: string;
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  alcance: 'GLOBAL' | 'COMPANY' | 'PARTICIPATION' | 'NONE';
}

export const listarPermisos = () => apiClient.get<PermisoItem[]>('/permisos');

export const listarRoles = () => apiClient.get<RolItem[]>('/roles');

export const listarRolesPermisos = () => apiClient.get<VistaRolPermiso[]>('/roles-permisos');

export const listarPermisosPorRol = (idRol: number) =>
  apiClient.get<any[]>(`/roles-permisos/${idRol}`);

export const toggleRolPermiso = (id_rol: number, id_permiso: number, alcance?: string) =>
  apiClient.post<{ asignado: boolean; id_rol: number; id_permiso: number; alcance?: string }>(
    '/roles-permisos/toggle',
    { id_rol, id_permiso, alcance },
  );

export const guardarMatrizRol = (idRol: number, modulos: ModuloPermisosConfig[]) =>
  apiClient.post<{ ok: boolean; mensaje: string }>(`/roles-permisos/matriz/${idRol}`, { modulos });

export const restablecerPredeterminadosRol = (idRol: number) =>
  apiClient.post<{ ok: boolean; mensaje: string }>(`/roles-permisos/restablecer/${idRol}`, {});
