import type { Rol } from '../services/auth';

export interface NavItem {
  label: string;
  path: string;
  roles: Rol[];
}

// Orden: "Inicio" primero, y el resto ordenado alfabÃ©ticamente de la A a la Z.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', path: '/', roles: ['administrador', 'bombero', 'capitan', 'mecanico'] },
  { label: 'Despachos', path: '/despachos', roles: ['administrador', 'bombero', 'capitan', 'mecanico'] },
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
  capitan: 'CapitÃ¡n / Comandancia',
  mecanico: 'MecÃ¡nico',
};
