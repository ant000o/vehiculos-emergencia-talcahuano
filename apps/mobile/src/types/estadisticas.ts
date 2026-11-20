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

// Respuesta de GET /estadisticas/kpis-inicio (disponible para roles sin acceso al dashboard completo).
export interface KpisInicio {
  bomberos_operativos: number;
  bomberos_en_emergencia: number;
  flota_operativa: number;
  flota_en_emergencia: number;
  flota_en_mantencion: number;
  grifos_operativos: number;
  grifos_fuera_servicio: number;
  repuestos_criticos: number;
}