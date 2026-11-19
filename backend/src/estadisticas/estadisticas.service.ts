import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Servicio de estadísticas agregadas para el dashboard del frontend
 * y las pantallas de resumen de la app mobile, respetando el alcance de compañía.
 */
@Injectable()
export class EstadisticasService {
  constructor(private readonly dataSource: DataSource) {}

  /** Resumen general: conteos por estado, últimas mantenciones, alertas de stock */
  async getDashboard(idCompania?: number) {
    const params = idCompania ? [idCompania] : [];
    const ciaFilterVeh = idCompania ? `WHERE id_compania = $1` : '';
    const ciaFilterMant = idCompania ? `JOIN vehiculo v ON v.id_vehiculo = m.id_vehiculo WHERE v.id_compania = $1` : '';
    const ciaFilterGrifo = idCompania ? `WHERE id_compania = $1` : '';
    const ciaFilterInv = idCompania ? `AND id_compania = $1` : '';

    const [flota, mantenciones, grifos, inventario] = await Promise.all([
      this.dataSource.query(`
        SELECT estado_operativo AS estado, COUNT(*)::int AS total
        FROM vehiculo
        ${ciaFilterVeh}
        GROUP BY estado_operativo
      `, params),
      this.dataSource.query(`
        SELECT m.estado_mantencion AS estado, COUNT(*)::int AS total
        FROM mantencion m
        ${ciaFilterMant}
        GROUP BY m.estado_mantencion
      `, params),
      this.dataSource.query(`
        SELECT estado_operativo AS estado, COUNT(*)::int AS total
        FROM grifo
        ${ciaFilterGrifo}
        GROUP BY estado_operativo
      `, params),
      this.dataSource.query(`
        SELECT COUNT(*)::int AS articulos_bajo_stock
        FROM articulo_inventario
        WHERE stock_actual <= 5 ${ciaFilterInv}
      `, params),
    ]);

    return { flota, mantenciones, grifos, inventario: inventario[0] };
  }

  /** Mantenciones agrupadas por mes para gráficos históricos */
  async getMantencionPorMes(idCompania?: number) {
    if (idCompania) {
      return this.dataSource.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', m.fecha_ingreso), 'YYYY-MM') AS mes,
          m.tipo_mantencion AS tipo,
          COUNT(*)::int AS total
        FROM mantencion m
        JOIN vehiculo v ON v.id_vehiculo = m.id_vehiculo
        WHERE m.fecha_ingreso IS NOT NULL AND v.id_compania = $1
        GROUP BY mes, m.tipo_mantencion
        ORDER BY mes ASC
      `, [idCompania]);
    }

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
  async getVehiculosMasMantenidos(idCompania?: number) {
    const params = idCompania ? [idCompania] : [];
    const ciaFilter = idCompania ? `WHERE v.id_compania = $1` : '';

    return this.dataSource.query(`
      SELECT
        v.id_vehiculo, v.patente, v.marca, v.modelo,
        COUNT(m.id_mantencion)::int AS total_mantenciones,
        COALESCE(SUM(m.costo_mano_obra), 0)::float AS costo_total
      FROM vehiculo v
      LEFT JOIN mantencion m ON m.id_vehiculo = v.id_vehiculo
      ${ciaFilter}
      GROUP BY v.id_vehiculo, v.patente, v.marca, v.modelo
      ORDER BY costo_total DESC, total_mantenciones DESC
      LIMIT 5
    `, params);
  }

  /** Artículos con stock crítico (<=5 unidades) */
  async getStockCritico(idCompania?: number) {
    const params = idCompania ? [idCompania] : [];
    const ciaFilter = idCompania ? `AND a.id_compania = $1` : '';

    return this.dataSource.query(`
      SELECT
        a.id_articulo, a.nombre_articulo, a.stock_actual, a.costo_unitario_actual,
        c.nombre_categoria
      FROM articulo_inventario a
      JOIN categoria_articulo c ON c.id_categoria = a.id_categoria
      WHERE a.stock_actual <= 5 ${ciaFilter}
      ORDER BY a.stock_actual ASC
    `, params);
  }

  /** Despachos activos (en_curso) */
  async getDespachosActivos(idCompania?: number) {
    const params = idCompania ? [idCompania] : [];
    const ciaFilter = idCompania ? `AND d.id_compania = $1` : '';

    return this.dataSource.query(`
      SELECT
        d.id_despacho, d.fecha_hora_despacho, d.tipo_emergencia, d.estado_emergencia,
        v.patente, v.marca, v.modelo,
        c.nombre AS compania
      FROM despacho_emergencia d
      JOIN vehiculo v ON v.id_vehiculo = d.id_vehiculo
      JOIN compania c ON c.id_compania = d.id_compania
      WHERE d.estado_emergencia = 'en_curso' ${ciaFilter}
      ORDER BY d.fecha_hora_despacho DESC
    `, params);
  }

  /** Ranking de vehículos con más días en taller / tiempos de reparación (HU-24) */
  async getTiemposReparacion(idCompania?: number) {
    const params = idCompania ? [idCompania] : [];
    const ciaFilter = idCompania ? `WHERE v.id_compania = $1` : '';

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
      ${ciaFilter}
      GROUP BY v.id_vehiculo, v.patente, v.marca, v.modelo
      ORDER BY dias_en_taller DESC
    `, params);
  }

  /** Alertas de mantencion preventiva proxima o vencida (ciclo de 10.000 km) */
  async getAlertasMantencion(idCompania?: number) {
    const params = idCompania ? [idCompania] : [];
    const ciaFilter = idCompania ? `WHERE v.id_compania = $1` : '';

    return this.dataSource.query(`
      WITH vehiculo_info AS (
        SELECT
          v.id_vehiculo,
          v.patente,
          v.marca,
          v.modelo,
          COALESCE(v.kilometraje, 0)::int AS kilometraje,
          v.estado_operativo,
          MAX(m.fecha_ingreso) AS ultima_mantencion,
          COALESCE(MAX(m.kilometraje), 0)::int AS km_ultima_mantencion
        FROM vehiculo v
        LEFT JOIN mantencion m ON m.id_vehiculo = v.id_vehiculo
        ${ciaFilter}
        GROUP BY v.id_vehiculo, v.patente, v.marca, v.modelo, v.kilometraje, v.estado_operativo
      ),
      calculo_ciclo AS (
        SELECT
          vi.*,
          CASE
            WHEN vi.km_ultima_mantencion > 0 THEN vi.km_ultima_mantencion + 10000
            ELSE ((FLOOR(vi.kilometraje / 10000.0) + 1)::int * 10000)
          END AS proximo_km_mantencion
        FROM vehiculo_info vi
      )
      SELECT
        cc.id_vehiculo,
        cc.patente,
        cc.marca,
        cc.modelo,
        cc.kilometraje,
        cc.estado_operativo,
        cc.ultima_mantencion,
        cc.proximo_km_mantencion,
        (cc.proximo_km_mantencion - cc.kilometraje) AS km_restantes,
        CASE
          WHEN cc.kilometraje >= cc.proximo_km_mantencion
            THEN 'Mantencion de rutina requerida (limite alcanzado: ' || cc.proximo_km_mantencion || ' km)'
          WHEN (cc.proximo_km_mantencion - cc.kilometraje) <= 3000
            THEN 'Proxima mantencion en ' || (cc.proximo_km_mantencion - cc.kilometraje) || ' km (a los ' || cc.proximo_km_mantencion || ' km)'
          ELSE 'Revision preventiva requerida'
        END AS motivo_alerta,
        CASE
          WHEN cc.kilometraje >= cc.proximo_km_mantencion THEN 'critica'
          ELSE 'advertencia'
        END AS nivel_alerta
      FROM calculo_ciclo cc
      WHERE cc.kilometraje >= (cc.proximo_km_mantencion - 3000)
      ORDER BY (cc.proximo_km_mantencion - cc.kilometraje) ASC, cc.kilometraje DESC
    `, params);
  }

  async getKpisOperativos(idCompania?: number) {
    const params = idCompania ? [idCompania] : [];
    const ciaFilterUser = idCompania ? `AND u.id_compania = $1` : '';
    const ciaFilterVeh = idCompania ? `AND v.id_compania = $1` : '';
    const ciaFilterGrifo = idCompania ? `WHERE id_compania = $1` : '';
    const ciaFilterInv = idCompania ? `AND id_compania = $1` : '';

    const res = await this.dataSource.query(`
      SELECT
        (SELECT COUNT(u.id_usuario)::int FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE u.estado_activo = true AND LOWER(r.nombre_rol) = 'bombero' ${ciaFilterUser} AND u.id_usuario NOT IN (SELECT dp.id_usuario FROM despacho_personal dp JOIN despacho_emergencia d ON d.id_despacho = dp.id_despacho WHERE d.estado_emergencia = 'en_curso')) AS bomberos_operativos,
        (SELECT COUNT(DISTINCT dp.id_usuario)::int FROM despacho_personal dp JOIN despacho_emergencia d ON d.id_despacho = dp.id_despacho JOIN usuario u ON u.id_usuario = dp.id_usuario WHERE d.estado_emergencia = 'en_curso' ${ciaFilterUser}) AS bomberos_en_emergencia,
        (SELECT COUNT(*)::int FROM vehiculo v WHERE v.estado_operativo = 'operativo' ${ciaFilterVeh} AND v.id_vehiculo NOT IN (SELECT d.id_vehiculo FROM despacho_emergencia d WHERE d.estado_emergencia = 'en_curso')) AS flota_operativa,
        (SELECT COUNT(DISTINCT d.id_vehiculo)::int FROM despacho_emergencia d JOIN vehiculo v ON v.id_vehiculo = d.id_vehiculo WHERE d.estado_emergencia = 'en_curso' ${ciaFilterVeh}) AS flota_en_emergencia,
        (SELECT COUNT(*)::int FROM vehiculo v WHERE v.estado_operativo = 'en_mantencion' ${ciaFilterVeh}) AS flota_en_mantencion,
        (SELECT COUNT(*)::int FROM grifo ${ciaFilterGrifo ? ciaFilterGrifo + " AND estado_operativo = 'operativo'" : "WHERE estado_operativo = 'operativo'"}) AS grifos_operativos,
        (SELECT COUNT(*)::int FROM grifo ${ciaFilterGrifo ? ciaFilterGrifo + " AND estado_operativo = 'fuera_de_servicio'" : "WHERE estado_operativo = 'fuera_de_servicio'"}) AS grifos_fuera_servicio,
        (SELECT COUNT(*)::int FROM articulo_inventario WHERE stock_actual <= 5 ${ciaFilterInv}) AS repuestos_criticos
    `, params);
    return res[0];
  }
}
