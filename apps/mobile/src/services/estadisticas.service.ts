import { api } from './api';
import { DashboardEstadisticas, AlertaMantencion, KpisInicio } from '../types/estadisticas';
 
export async function obtenerDashboard(): Promise<DashboardEstadisticas> {
  const { data } = await api.get<DashboardEstadisticas>('/estadisticas/dashboard');
  return data;
}
 
export async function obtenerAlertasMantencion(): Promise<AlertaMantencion[]> {
  const { data } = await api.get<AlertaMantencion[]>('/estadisticas/alertas-mantencion');
  return data;
}

// Indicadores de la pantalla Inicio para roles que no tienen acceso al dashboard completo
// (capitán, bombero, mecánico, central). Requiere el permiso "inicio".
export async function obtenerKpisInicio(): Promise<KpisInicio> {
  const { data } = await api.get<KpisInicio>('/estadisticas/kpis-inicio');
  return data;
}