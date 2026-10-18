import { api } from './api';
import { DashboardEstadisticas, AlertaMantencion } from '../types/estadisticas';
 
export async function obtenerDashboard(): Promise<DashboardEstadisticas> {
  const { data } = await api.get<DashboardEstadisticas>('/estadisticas/dashboard');
  return data;
}
 
export async function obtenerAlertasMantencion(): Promise<AlertaMantencion[]> {
  const { data } = await api.get<AlertaMantencion[]>('/estadisticas/alertas-mantencion');
  return data;
}