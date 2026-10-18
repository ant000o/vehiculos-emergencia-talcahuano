export interface ConteoPorEstado {
  estado: string;
  total: number;
}
 
export interface DashboardEstadisticas {
  flota: ConteoPorEstado[];
  mantenciones: ConteoPorEstado[];
  grifos: ConteoPorEstado[];
  inventario: { articulos_bajo_stock: number };
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
 