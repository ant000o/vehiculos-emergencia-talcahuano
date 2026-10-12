import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Servicio de estadísticas agregadas para el dashboard del frontend
 * y las pantallas de resumen de la app mobile.
 */
@Injectable()
export class EstadisticasService {
  constructor(private readonly dataSource: DataSource) {}

  /** Resumen general: conteos por estado, últimas mantenciones, alertas de stock */
  async getDashboard() {
    const [flota, mantenciones, grifos, inventario] = await Promise.all([
      this.dataSource.query(`
        SELECT estado_operativo AS estado, COUNT(*)::int AS total
        FROM vehiculo
        GROUP BY estado_operativo
      `),
      this.dataSource.query(`
        SELECT estado_mantencion AS estado, COUNT(*)::int AS total
        FROM mantencion
        GROUP BY estado_mantencion
      `),
      this.dataSource.query(`
        SELECT estado_operativo AS estado, COUNT(*)::int AS total
        FROM grifo
        GROUP BY estado_operativo
      `),
      this.dataSource.query(`
        SELECT COUNT(*)::int AS articulos_bajo_stock
        FROM articulo_inventario
        WHERE stock_actual <= 5
      `),
    ]);

    return { flota, mantenciones, grifos, inventario: inventario[0] };
  }

  /** Mantenciones agrupadas por mes para gráficos históricos */
  async getMantencionPorMes() {
    return this.dataSource.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', fecha_ingreso), 'YYYY-MM') AS mes,
        tipo_mantencion AS tipo,
        COUNT(*)::int AS total
      FROM mantencion
      WHERE fecha_ingreso IS NOT NULL
      GROUP BY mes, tipo_mantencion
      ORDER BY mes ASC
    `);
  }

  /** Vehículos con más mantenciones (top 5) */
  async getVehiculosMasMantenidos() {
    return this.dataSource.query(`
      SELECT
        v.id_vehiculo, v.patente, v.marca, v.modelo,
        COUNT(m.id_mantencion)::int AS total_mantenciones,
        COALESCE(SUM(m.costo_mano_obra), 0)::float AS costo_total
      FROM vehiculo v
      LEFT JOIN mantencion m ON m.id_vehiculo = v.id_vehiculo
      GROUP BY v.id_vehiculo, v.patente, v.marca, v.modelo
      ORDER BY costo_total DESC, total_mantenciones DESC
      LIMIT 5
    `);
  }

  /** Artículos con stock crítico (<=5 unidades) */
  async getStockCritico() {
    return this.dataSource.query(`
      SELECT
        a.id_articulo, a.nombre_articulo, a.stock_actual, a.costo_unitario_actual,
        c.nombre_categoria
      FROM articulo_inventario a
      JOIN categoria_articulo c ON c.id_categoria = a.id_categoria
      WHERE a.stock_actual <= 5
      ORDER BY a.stock_actual ASC
    `);
  }

  /** Despachos activos (en_curso) */
  async getDespachosActivos() {
    return this.dataSource.query(`
      SELECT
        d.id_despacho, d.fecha_hora_despacho, d.tipo_emergencia, d.estado_emergencia,
        v.patente, v.marca, v.modelo,
        c.nombre AS compania
      FROM despacho_emergencia d
      JOIN vehiculo v ON v.id_vehiculo = d.id_vehiculo
      JOIN compania c ON c.id_compania = d.id_compania
      WHERE d.estado_emergencia = 'en_curso'
      ORDER BY d.fecha_hora_despacho DESC
    `);
  }

  /** Ranking de vehículos con más días en taller / tiempos de reparación (HU-24) */
  async getTiemposReparacion() {
    return this.dataSource.query(`
      SELECT
        v.id_vehiculo,
        v.patente,
        v.marca,
        v.modelo,
        COUNT(m.id_mantencion)::int AS total_ingresos,
        ROUND(COALESCE(SUM(
          EXTRACT(EPOCH FROM (COALESCE(m.fecha_salida, NOW()) - m.fecha_ingreso)) / 86400
        ), 0)::numeric, 1)::float AS dias_en_taller,
        ROUND(COALESCE(AVG(
          EXTRACT(EPOCH FROM (COALESCE(m.fecha_salida, NOW()) - m.fecha_ingreso)) / 86400
        ), 0)::numeric, 1)::float AS promedio_dias_por_mantencion
      FROM vehiculo v
      JOIN mantencion m ON m.id_vehiculo = v.id_vehiculo
      GROUP BY v.id_vehiculo, v.patente, v.marca, v.modelo
      ORDER BY dias_en_taller DESC
    `);
  }

  /** Alertas de mantención preventiva próxima o vencida (HU-15) */
  async getAlertasMantencion() {
    return this.dataSource.query(`
      SELECT
        v.id_vehiculo,
        v.patente,
        v.marca,
        v.modelo,
        v.kilometraje,
        v.estado_operativo,
        MAX(m.fecha_ingreso) AS ultima_mantencion,
        CASE
          WHEN v.kilometraje >= 10000 THEN 'Kilometraje crítico (≥ 10.000 km)'
          WHEN v.kilometraje >= 5000 THEN 'Inspección preventiva sugerida (≥ 5.000 km)'
          WHEN MAX(m.fecha_ingreso) IS NULL THEN 'Sin registro de mantención histórica'
          ELSE 'Revisión periódica requerida'
        END AS motivo_alerta,
        CASE
          WHEN v.kilometraje >= 10000 THEN 'critica'
          ELSE 'advertencia'
        END AS nivel_alerta
      FROM vehiculo v
      LEFT JOIN mantencion m ON m.id_vehiculo = v.id_vehiculo
      WHERE v.kilometraje >= 5000 OR m.fecha_ingreso IS NULL
      GROUP BY v.id_vehiculo, v.patente, v.marca, v.modelo, v.kilometraje, v.estado_operativo
      ORDER BY v.kilometraje DESC
    `);
  }
}
