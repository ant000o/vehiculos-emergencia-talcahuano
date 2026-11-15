import { apiClient as api } from './apiClient';
import { listarMantenciones, type Mantencion } from './mantenciones';

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

// HU-24: reporte de gastos por reparaciones, filtrado por rango de fechas.
// Excel en configuración regional chilena usa ";" como separador de columnas.
const SEPARADOR_CSV = ';';

/** Fecha local YYYY-MM-DD (no UTC) para comparar contra <input type="date">. */
function fechaLocal(fecha: string): string {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function celdaCSV(valor: string | number): string {
  const texto = String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function costoInsumos(m: Mantencion): number {
  return (m.detalles_articulos ?? []).reduce(
    (acc, d) => acc + Number(d.cantidad) * Number(d.costo_unitario_historico),
    0,
  );
}

/**
 * Descarga un CSV con la sumatoria de mano de obra e insumos por vehículo
 * entre `desde` y `hasta` (ambos inclusive, formato YYYY-MM-DD), según la
 * fecha de ingreso de la mantención. Las mantenciones canceladas no se cuentan.
 * Devuelve cuántas mantenciones entraron al reporte (0 = no se descarga nada).
 */
export const exportarGastosCSV = async (desde: string, hasta: string): Promise<number> => {
  const mantenciones = (await listarMantenciones()).filter((m) => {
    if (m.estado_mantencion === 'cancelada') return false;
    const f = fechaLocal(m.fecha_ingreso);
    return f >= desde && f <= hasta;
  });

  if (mantenciones.length === 0) return 0;

  const porVehiculo = new Map<number, { patente: string; marca: string; modelo: string; cantidad: number; manoObra: number; insumos: number }>();
  for (const m of mantenciones) {
    const fila = porVehiculo.get(m.id_vehiculo) ?? {
      patente: m.vehiculo?.patente ?? `ID ${m.id_vehiculo}`,
      marca: m.vehiculo?.marca ?? '',
      modelo: m.vehiculo?.modelo ?? '',
      cantidad: 0,
      manoObra: 0,
      insumos: 0,
    };
    fila.cantidad += 1;
    fila.manoObra += Number(m.costo_mano_obra);
    fila.insumos += costoInsumos(m);
    porVehiculo.set(m.id_vehiculo, fila);
  }

  const filas = [...porVehiculo.values()].sort((a, b) => b.manoObra + b.insumos - (a.manoObra + a.insumos));
  const lineas: (string | number)[][] = [
    [`Reporte de gastos por reparaciones: ${desde} a ${hasta}`],
    ['Patente', 'Marca', 'Modelo', 'Mantenciones', 'Mano de obra', 'Insumos', 'Total'],
    ...filas.map((f) => [f.patente, f.marca, f.modelo, f.cantidad, f.manoObra, f.insumos, f.manoObra + f.insumos]),
  ];
  const totalMO = filas.reduce((a, f) => a + f.manoObra, 0);
  const totalIns = filas.reduce((a, f) => a + f.insumos, 0);
  lineas.push(['TOTAL PERIODO', '', '', mantenciones.length, totalMO, totalIns, totalMO + totalIns]);

  const csv = lineas.map((l) => l.map(celdaCSV).join(SEPARADOR_CSV)).join('\r\n');
  // BOM para que Excel respete las tildes.
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_gastos_${desde}_a_${hasta}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return mantenciones.length;
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