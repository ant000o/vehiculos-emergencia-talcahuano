import { apiClient as api } from './apiClient';

export interface ResumenDashboard {
  flota: { estado: string; total: number }[];
  mantenciones: { estado: string; total: number }[];
  grifos: { estado: string; total: number }[];
  inventario: { articulos_bajo_stock: number };
}

export interface MantencionPorMes {
  mes: string;
  tipo: string;
  total: number;
}

export interface VehiculoMasMantenido {
  id_vehiculo: number;
  patente: string;
  marca: string;
  modelo: string;
  total_mantenciones: number;
  costo_total: number;
}

export interface TiempoReparacion {
  id_vehiculo: number;
  patente: string;
  marca: string;
  modelo: string;
  total_ingresos: number;
  dias_en_taller: number;
  promedio_dias_por_mantencion: number;
}

export interface AlertaMantencion {
  id_vehiculo: number;
  patente: string;
  marca: string;
  modelo: string;
  kilometraje: number;
  estado_operativo: string;
  ultima_mantencion: string | null;
  motivo_alerta: string;
  nivel_alerta: 'critica' | 'advertencia';
}

export interface DespachoActivo {
  id_despacho: number;
  fecha_hora_despacho: string;
  tipo_emergencia: string;
  estado_emergencia: string;
  patente: string;
  marca: string;
  modelo: string;
  compania: string;
}

export const obtenerDashboard = () => api.get<ResumenDashboard>('/estadisticas/dashboard');
export const obtenerMantencionesPorMes = () => api.get<MantencionPorMes[]>('/estadisticas/mantenciones-por-mes');
export const obtenerVehiculosMasMantenidos = () => api.get<VehiculoMasMantenido[]>('/estadisticas/vehiculos-mas-mantenidos');
export const obtenerTiemposReparacion = () => api.get<TiempoReparacion[]>('/estadisticas/tiempos-reparacion');
export const obtenerAlertasMantencion = () => api.get<AlertaMantencion[]>('/estadisticas/alertas-mantencion');
export const obtenerDespachosActivos = () => api.get<DespachoActivo[]>('/estadisticas/despachos-activos');

// Para exportar (HU-23)
export const exportarGastosCSV = async () => {
  const vehiculos = await obtenerVehiculosMasMantenidos();
  
  let csv = "Patente,Marca,Modelo,Total Mantenciones,Costo Total\n";
  vehiculos.forEach((v: VehiculoMasMantenido) => {
    csv += `${v.patente},${v.marca},${v.modelo},${v.total_mantenciones},${v.costo_total}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reporte_gastos.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
export interface KpisOperativos {
  bomberos_operativos: number;
  bomberos_en_emergencia: number;
  flota_operativa: number;
  flota_en_emergencia: number;
  flota_en_mantencion: number;
  grifos_operativos: number;
  grifos_fuera_servicio: number;
  repuestos_criticos: number;
}
export const obtenerKpisOperativos = () => api.get<KpisOperativos>('/estadisticas/kpis-operativos');