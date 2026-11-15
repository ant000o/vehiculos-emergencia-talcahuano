import type { Rol } from '../services/auth';

export interface NavItem {
  label: string;
  path: string;
  roles: Rol[];
}

// Orden: "Inicio" primero, y el resto ordenado alfabéticamente de la A a la Z.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', path: '/', roles: ['administrador', 'bombero', 'capitan', 'mecanico', 'central'] },
  // Despachos: Central opera; Comandancia y Bomberos monitorean
  { label: 'Despachos', path: '/despachos', roles: ['administrador', 'central', 'capitan', 'bombero'] },
  { label: 'Grifos', path: '/grifos', roles: ['administrador', 'capitan', 'mecanico', 'bombero', 'central'] },
  { label: 'Historial de Estados', path: '/historial-estados', roles: ['administrador', 'mecanico', 'bombero', 'capitan'] },
  { label: 'Inventario', path: '/inventario', roles: ['administrador', 'mecanico', 'capitan'] },
  { label: 'Mantenciones', path: '/mantenciones', roles: ['administrador', 'mecanico', 'capitan'] },
  { label: 'Mapa de Despacho', path: '/mapa', roles: ['administrador', 'central', 'capitan', 'bombero'] },
  { label: 'Usuarios', path: '/usuarios', roles: ['administrador', 'capitan'] },
  { label: 'Vehículos', path: '/vehiculos', roles: ['administrador', 'bombero', 'capitan', 'mecanico', 'central'] },
];

export const ROLE_LABELS: Record<Rol, string> = {
  administrador: 'Administrador',
  central: 'Central de Despacho',
  capitan: 'Capitán / Comandancia',
  bombero: 'Bombero',
  mecanico: 'Mecánico',
};
