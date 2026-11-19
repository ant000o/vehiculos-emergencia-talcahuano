import type { Rol } from '../services/auth';

export interface NavItem {
  label: string;
  path: string;
  /** Módulo asociado al nuevo estándar RBAC */
  modulo?: string;
  /** Código o lista de códigos de permiso en la matriz RBAC de la BD (compatibilidad) */
  permiso?: string | string[];
  /** Roles que pueden acceder de forma complementaria o exclusiva */
  roles?: Rol[];
}

// Orden: "Inicio" primero, y el resto ordenado alfabéticamente de la A a la Z.
// El acceso se rige 100% por los permisos de la base de datos (rol_permiso).
export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', path: '/', modulo: 'inicio' },
  { label: 'Dashboard KPI', path: '/dashboard', modulo: 'dashboard' },
  { label: 'Despachos', path: '/despachos', modulo: 'despachos' },
  { label: 'Grifos', path: '/grifos', modulo: 'grifos' },
  { label: 'Historial de Estados', path: '/historial-estados', modulo: 'operatividad' },
  { label: 'Historial de Cambios', path: '/historial-cambios', permiso: 'auditoria.ver' },
  { label: 'Inventario', path: '/inventario', modulo: 'inventario' },
  { label: 'Mantenciones', path: '/mantenciones', modulo: 'mantenciones' },
  { label: 'Mapa de Despacho', path: '/mapa', modulo: 'mapa' },
  { label: 'Permisos', path: '/permisos', roles: ['administrador'] },
  { label: 'Usuarios', path: '/usuarios', modulo: 'usuarios' },
  { label: 'Vehículos', path: '/vehiculos', modulo: 'vehiculos' },
];

export const ROLE_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  central: 'Central de Despacho',
  capitan: 'Capitán / Comandancia',
  'capitán': 'Capitán / Comandancia',
  comandante: 'Comandante',
  director: 'Director',
  bombero: 'Bombero',
  mecanico: 'Mecánico',
  'mecánico': 'Mecánico',
};

export function obtenerEtiquetaRol(rol?: string): string {
  if (!rol) return '';
  const limpio = rol.toLowerCase().trim();
  return ROLE_LABELS[limpio] || rol;
}