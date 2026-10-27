import { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { ROLE_LABELS } from '../config/navigation';
import { 
  obtenerDashboard, 
  obtenerMantencionesPorMes, 
  obtenerVehiculosMasMantenidos,
  obtenerTiemposReparacion,
  obtenerAlertasMantencion,
  obtenerKpisOperativos,
  exportarGastosCSV,
  type ResumenDashboard,
  type MantencionPorMes,
  type VehiculoMasMantenido,
  type TiempoReparacion,
  type AlertaMantencion,
  type KpisOperativos
} from '../services/estadisticas';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import './dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const MESES_NOMBRES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function DashboardPage() {
  const { user } = useAuth();
  
  const [dashboard, setDashboard] = useState<ResumenDashboard | null>(null);
  const [meses, setMeses] = useState<MantencionPorMes[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoMasMantenido[]>([]);
  const [tiempos, setTiempos] = useState<TiempoReparacion[]>([]);
  const [alertas, setAlertas] = useState<AlertaMantencion[]>([]);
  const [kpis, setKpis] = useState<KpisOperativos | null>(null);

  useEffect(() => {
    Promise.all([
      obtenerDashboard(),
      obtenerMantencionesPorMes(),
      obtenerVehiculosMasMantenidos(),
      obtenerTiemposReparacion().catch(() => []),
      obtenerAlertasMantencion().catch(() => []),
      obtenerKpisOperativos().catch(() => null)
    ]).then(([d, m, v, t, a, k]) => {
      setDashboard(d);
      setMeses(m);
      setVehiculos([...v].sort((a, b) => Number(b.costo_total) - Number(a.costo_total)));
      setTiempos(t);
      setAlertas(a);
      setKpis(k as KpisOperativos | null);
    }).catch(console.error);
  }, []);

  if (!user) return null;
  const esComandancia = user.rol === 'administrador' || user.rol === 'capitan';

  // Configuración estricta de colores para el gráfico de flota:
  // Operativo = Verde (#16a34a), En Mantención = Naranjo (#ea580c), Fuera de Servicio = Rojo (#dc2626)
  const configFlota = [
    { estado: 'operativo', label: 'Operativo', color: '#16a34a' },
    { estado: 'en_mantencion', label: 'En Mantención', color: '#ea580c' },
    { estado: 'fuera_de_servicio', label: 'Fuera de Servicio', color: '#dc2626' },
  ];

  const pieFlotaData = {
    labels: configFlota.map(c => c.label),
    datasets: [{
      label: 'Vehículos',
      data: configFlota.map(c => {
        const item = dashboard?.flota?.find(f => f.estado === c.estado);
        return item ? Number(item.total) : 0;
      }),
      backgroundColor: configFlota.map(c => c.color),
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };

  // Histórico de mantenciones por mes (soporta los 4 tipos: Preventiva, Correctiva, Revisión, Emergencia)
  const labelsMesRaw = Array.from(new Set(meses.map(m => m.mes))).sort();
  const labelsMes = labelsMesRaw.map(m => {
    const parts = m.split('-');
    if (parts.length === 2) {
      const idx = parseInt(parts[1], 10) - 1;
      return `${MESES_NOMBRES[idx] || parts[1]} ${parts[0]}`;
    }
    return m;
  });

  const barMesesData = {
    labels: labelsMes,
    datasets: [
      { 
        label: 'Preventivas', 
        data: labelsMesRaw.map(mes => meses.find(m => m.mes === mes && m.tipo === 'preventiva')?.total || 0), 
        backgroundColor: '#1f3a63',
        borderRadius: 4,
      },
      { 
        label: 'Correctivas', 
        data: labelsMesRaw.map(mes => meses.find(m => m.mes === mes && m.tipo === 'correctiva')?.total || 0), 
        backgroundColor: '#ea580c',
        borderRadius: 4,
      },
      { 
        label: 'Revisiones', 
        data: labelsMesRaw.map(mes => meses.find(m => m.mes === mes && m.tipo === 'revision')?.total || 0), 
        backgroundColor: '#0d9488',
        borderRadius: 4,
      },
      { 
        label: 'Emergencias', 
        data: labelsMesRaw.map(mes => meses.find(m => m.mes === mes && m.tipo === 'emergencia')?.total || 0), 
        backgroundColor: '#dc2626',
        borderRadius: 4,
      },
    ]
  };

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">
        Hola, {user.nombre}
      </h1>
      <p className="dashboard__subtitle">
        Sesión activa como <strong>{ROLE_LABELS[user.rol]}</strong>.
      </p>

      {/* HU-15: Banner Alerta de Mantención Próxima o Vencida */}
      {alertas.length > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fef3c7',
          borderLeft: '4px solid #f59e0b',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 18px',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <strong style={{ color: '#92400e', fontSize: '0.9375rem' }}>
              Alertas de Mantenimiento Preventivo (HU-15)
            </strong>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {alertas.map((a) => (
              <span
                key={a.id_vehiculo}
                style={{
                  backgroundColor: a.nivel_alerta === 'critica' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: a.nivel_alerta === 'critica' ? '#b91c1c' : '#92400e',
                  border: `1px solid ${a.nivel_alerta === 'critica' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <strong>{a.patente}</strong> ({a.marca} {a.modelo}): {a.motivo_alerta} — {Number(a.kilometraje).toLocaleString('es-CL')} km
              </span>
            ))}
          </div>
        </div>
      )}

            {/* Indicadores KPI - 8 tarjetas operativas en tiempo real */}
      <div className="dashboard__kpis">
        {/* Bomberos Operativos */}
        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Bomberos Operativos</span>
          <p className="dashboard__kpi-value" style={{ color: '#15803d' }}>{kpis?.bomberos_operativos ?? 0}</p>
          <span className="dashboard__kpi-desc">Disponibles, sin emergencia activa</span>
        </div>

        {/* Bomberos en Emergencia */}
        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Bomberos en Emergencia</span>
          <p className="dashboard__kpi-value" style={{ color: kpis?.bomberos_en_emergencia ? '#b91c1c' : undefined }}>{kpis?.bomberos_en_emergencia ?? 0}</p>
          <span className="dashboard__kpi-desc">En despacho activo</span>
        </div>

        {/* Flota Operativa */}
        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Flota Operativa</span>
          <p className="dashboard__kpi-value" style={{ color: '#15803d' }}>{kpis?.flota_operativa ?? 0}</p>
          <span className="dashboard__kpi-desc">Unidades listas, sin despacho activo</span>
        </div>

        {/* Flota en Emergencia */}
        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Flota en Emergencia</span>
          <p className="dashboard__kpi-value" style={{ color: kpis?.flota_en_emergencia ? '#b91c1c' : undefined }}>{kpis?.flota_en_emergencia ?? 0}</p>
          <span className="dashboard__kpi-desc">Vehículos en despacho activo</span>
        </div>

        {/* Flota en Mantención */}
        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Flota en Mantención</span>
          <p className="dashboard__kpi-value" style={{ color: kpis?.flota_en_mantencion ? '#c2410c' : undefined }}>{kpis?.flota_en_mantencion ?? 0}</p>
          <span className="dashboard__kpi-desc">Vehículos en taller</span>
        </div>

        {/* Grifos Operativos */}
        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Grifos Funcionando</span>
          <p className="dashboard__kpi-value" style={{ color: '#15803d' }}>{kpis?.grifos_operativos ?? 0}</p>
          <span className="dashboard__kpi-desc">En servicio y operativos</span>
        </div>

        {/* Grifos Fuera de Servicio */}
        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Grifos Fuera de Servicio</span>
          <p className="dashboard__kpi-value" style={{ color: kpis?.grifos_fuera_servicio ? '#b91c1c' : undefined }}>{kpis?.grifos_fuera_servicio ?? 0}</p>
          <span className="dashboard__kpi-desc">Reportados con fallas</span>
        </div>

        {/* Repuestos Críticos */}
        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Repuestos Críticos</span>
          <p className="dashboard__kpi-value" style={{ color: kpis?.repuestos_criticos ? '#b45309' : undefined }}>{kpis?.repuestos_criticos ?? 0}</p>
          <span className="dashboard__kpi-desc">Artículos con stock ≤ 5</span>
        </div>
      </div>

      {esComandancia && (
        <>
          <div className="dashboard__charts-grid">
            <div className="dashboard__card">
              <div className="dashboard__card-header">
                <h3 className="dashboard__card-title">Estado de la Flota</h3>
              </div>
              <div className="dashboard__chart-container" style={{ height: 260, display: 'flex', justifyContent: 'center' }}>
                <Pie 
                  data={pieFlotaData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }} 
                />
              </div>
            </div>

            <div className="dashboard__card">
              <div className="dashboard__card-header">
                <h3 className="dashboard__card-title">Histórico de Mantenciones</h3>
              </div>
              <div className="dashboard__chart-container" style={{ height: 260 }}>
                <Bar 
                  data={barMesesData} 
                  options={{ 
                    maintainAspectRatio: false, 
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom' }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>

          <div className="dashboard__card">
            <div className="dashboard__card-header">
              <h3 className="dashboard__card-title">Top Vehículos con Mayor Gasto de Mantención</h3>
              {user.rol === 'administrador' && (
                <button className="dashboard__btn-exportar" onClick={exportarGastosCSV}>
                  ↓ Exportar a CSV
                </button>
              )}
            </div>
            
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Marca y Modelo</th>
                  <th>Total Mantenciones</th>
                  <th>Costo Histórico</th>
                </tr>
              </thead>
              <tbody>
                {vehiculos.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-ink-400)', padding: 'var(--space-6)' }}>
                      No hay registros de mantenciones con costo aún.
                    </td>
                  </tr>
                ) : (
                  vehiculos.map(v => (
                    <tr key={v.id_vehiculo}>
                      <td className="dashboard__table-patente">{v.patente}</td>
                      <td>{v.marca} {v.modelo}</td>
                      <td>{v.total_mantenciones}</td>
                      <td><strong>${Number(v.costo_total).toLocaleString('es-CL')}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* HU-24: Resumen de Tiempos de Reparación y Estadía en Taller */}
          <div className="dashboard__card" style={{ marginTop: 'var(--space-6)' }}>
            <div className="dashboard__card-header">
              <h3 className="dashboard__card-title">Resumen de Tiempos de Reparación y Estadía en Taller (HU-24)</h3>
            </div>
            
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Marca y Modelo</th>
                  <th>Ingresos a Taller</th>
                  <th>Días Totales en Taller</th>
                  <th>Promedio Días / Mantención</th>
                </tr>
              </thead>
              <tbody>
                {tiempos.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-ink-400)', padding: 'var(--space-6)' }}>
                      No hay registros históricos de estadía en taller aún.
                    </td>
                  </tr>
                ) : (
                  tiempos.map((t) => (
                    <tr key={t.id_vehiculo}>
                      <td className="dashboard__table-patente">{t.patente}</td>
                      <td>{t.marca} {t.modelo}</td>
                      <td>{t.total_ingresos}</td>
                      <td>
                        <strong style={{ color: t.dias_en_taller > 5 ? '#b91c1c' : '#1f3a63' }}>
                          {t.dias_en_taller} días
                        </strong>
                      </td>
                      <td>{t.promedio_dias_por_mantencion} días</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
