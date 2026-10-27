import type { Rol } from '../services/auth';

export interface NavItem {
  label: string;
  path: string;
  roles: Rol[];
}

// Orden: "Inicio" primero, y el resto ordenado alfabéticamente de la A a la Z.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', path: '/', roles: ['administrador', 'bombero', 'capitan', 'mecanico'] },
  // HU-28: el perfil Mecánico no ve el panel de despachos.
  { label: 'Despachos', path: '/despachos', roles: ['administrador', 'bombero', 'capitan'] },
  { label: 'Grifos', path: '/grifos', roles: ['administrador', 'capitan', 'mecanico', 'bombero'] },
  { label: 'Historial de Estados', path: '/historial-estados', roles: ['administrador', 'mecanico', 'bombero', 'capitan'] },
  { label: 'Inventario', path: '/inventario', roles: ['administrador', 'mecanico', 'capitan'] },
  { label: 'Mantenciones', path: '/mantenciones', roles: ['administrador', 'mecanico', 'capitan'] },
  { label: 'Mapa de Despacho', path: '/mapa', roles: ['administrador', 'capitan'] },
  { label: 'Usuarios', path: '/usuarios', roles: ['administrador'] },
  { label: 'Vehículos', path: '/vehiculos', roles: ['administrador', 'bombero', 'capitan', 'mecanico'] },
];

export const ROLE_LABELS: Record<Rol, string> = {
  administrador: 'Administrador',
  bombero: 'Bombero / Conductor',
  capitan: 'Capitán / Comandancia',
  mecanico: 'Mecánico',
};
