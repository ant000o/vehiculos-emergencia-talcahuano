import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { obtenerEtiquetaRol } from '../config/navigation';
import { obtenerKpisInicio, type KpisOperativos } from '../services/estadisticas';
import './dashboard.css';

export function InicioPage() {
  const { user, tienePermiso, hasPermission, getScope } = useAuth();
  const [kpis, setKpis] = useState<KpisOperativos | null>(null);

  useEffect(() => {
    obtenerKpisInicio()
      .then(setKpis)
      .catch(console.error);
  }, []);

  if (!user) return null;

  const alcanceInicio = getScope('inicio');
  const hayEmergenciaActiva =
    (kpis?.flota_en_emergencia ?? 0) > 0 || (kpis?.bomberos_en_emergencia ?? 0) > 0;

  const accesosRapidos = [
    {
      visible: hasPermission('despachos', 'view') || tienePermiso('despachos.view'),
      titulo: 'Panel de Despachos',
      descripcion: 'Seguimiento de emergencias activas y órdenes de salida',
      ruta: '/despachos',
      icono: '🚨',
    },
    {
      visible: hasPermission('mapa', 'view') || tienePermiso('mapa.view'),
      titulo: 'Mapa de Despacho',
      descripcion: 'Ubicación de flota, grifos y despacho georreferenciado',
      ruta: '/mapa',
      icono: '🗺️',
    },
    {
      visible: hasPermission('dashboard', 'view') || tienePermiso('dashboard.view'),
      titulo: 'Dashboard KPI y Reportes',
      descripcion: 'Gráficos de flota, mantenciones preventivas y costos',
      ruta: '/dashboard',
      icono: '📊',
    },
    {
      visible: hasPermission('vehiculos', 'view') || tienePermiso('vehiculos.view'),
      titulo: 'Gestión de Vehículos',
      descripcion: 'Estado operativo, odómetro y fichas técnicas de carros',
      ruta: '/vehiculos',
      icono: '🚒',
    },
    {
      visible: hasPermission('mantenciones', 'view') || tienePermiso('mantenciones.view'),
      titulo: 'Mantenciones',
      descripcion: 'Órdenes de taller preventivo y correctivo',
      ruta: '/mantenciones',
      icono: '🔧',
    },
    {
      visible: hasPermission('inventario', 'view') || tienePermiso('inventario.view'),
      titulo: 'Inventario y Repuestos',
      descripcion: 'Control de stock crítico y bodega',
      ruta: '/inventario',
      icono: '📦',
    },
  ].filter((item) => item.visible);

  return (
    <div className="dashboard">
      {/* Cabecera Institucional y Estado de Guardia */}
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          <h1 className="dashboard__title" style={{ marginBottom: '4px' }}>
            Hola, {user.nombre} {user.apellidos}
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-ink-600)' }}>
            <strong>{obtenerEtiquetaRol(user.rol)}</strong> ·{' '}
            {alcanceInicio === 'GLOBAL'
              ? 'Cobertura Global — Todas las Compañías'
              : 'Cobertura Operativa de Compañía'}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: hayEmergenciaActiva ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${hayEmergenciaActiva ? '#fecaca' : '#bbf7d0'}`,
            color: hayEmergenciaActiva ? '#b91c1c' : '#15803d',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <span>{hayEmergenciaActiva ? '🚨' : '🟢'}</span>
          <span>
            {hayEmergenciaActiva
              ? `Emergencia en curso (${kpis?.flota_en_emergencia ?? 0} carros / ${kpis?.bomberos_en_emergencia ?? 0} bomberos)`
              : 'Operación Normal — Sin emergencias activas'}
          </span>
          {hayEmergenciaActiva &&
            (hasPermission('despachos', 'view') || tienePermiso('despachos.view')) && (
              <Link
                to="/despachos"
                style={{
                  marginLeft: '6px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                }}
              >
                Ver despacho
              </Link>
            )}
        </div>
      </div>

      {/* 8 Tarjetas KPI Operativas en Tiempo Real */}
      <div className="dashboard__kpis">
        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Bomberos Operativos</span>
          <p className="dashboard__kpi-value" style={{ color: '#15803d' }}>
            {kpis?.bomberos_operativos ?? 0}
          </p>
          <span className="dashboard__kpi-desc">Disponibles, sin emergencia activa</span>
        </div>

        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Bomberos en Emergencia</span>
          <p
            className="dashboard__kpi-value"
            style={{ color: kpis?.bomberos_en_emergencia ? '#b91c1c' : undefined }}
          >
            {kpis?.bomberos_en_emergencia ?? 0}
          </p>
          <span className="dashboard__kpi-desc">En despacho activo</span>
        </div>

        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Flota Operativa</span>
          <p className="dashboard__kpi-value" style={{ color: '#15803d' }}>
            {kpis?.flota_operativa ?? 0}
          </p>
          <span className="dashboard__kpi-desc">Unidades listas, sin despacho activo</span>
        </div>

        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Flota en Emergencia</span>
          <p
            className="dashboard__kpi-value"
            style={{ color: kpis?.flota_en_emergencia ? '#b91c1c' : undefined }}
          >
            {kpis?.flota_en_emergencia ?? 0}
          </p>
          <span className="dashboard__kpi-desc">Vehículos en despacho activo</span>
        </div>

        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Flota en Mantención</span>
          <p
            className="dashboard__kpi-value"
            style={{ color: kpis?.flota_en_mantencion ? '#c2410c' : undefined }}
          >
            {kpis?.flota_en_mantencion ?? 0}
          </p>
          <span className="dashboard__kpi-desc">Vehículos en taller mecánico</span>
        </div>

        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Grifos Funcionando</span>
          <p className="dashboard__kpi-value" style={{ color: '#15803d' }}>
            {kpis?.grifos_operativos ?? 0}
          </p>
          <span className="dashboard__kpi-desc">En servicio y operativos</span>
        </div>

        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Grifos Fuera de Servicio</span>
          <p
            className="dashboard__kpi-value"
            style={{ color: kpis?.grifos_fuera_servicio ? '#b91c1c' : undefined }}
          >
            {kpis?.grifos_fuera_servicio ?? 0}
          </p>
          <span className="dashboard__kpi-desc">Reportados con fallas</span>
        </div>

        <div className="dashboard__kpi-card">
          <span className="dashboard__kpi-label">Repuestos Críticos</span>
          <p
            className="dashboard__kpi-value"
            style={{ color: kpis?.repuestos_criticos ? '#b45309' : undefined }}
          >
            {kpis?.repuestos_criticos ?? 0}
          </p>
          <span className="dashboard__kpi-desc">Artículos con stock inferior a 5</span>
        </div>
      </div>

      {/* Accesos Rápidos según Permisos del Rol */}
      {accesosRapidos.length > 0 && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.125rem',
              color: 'var(--color-navy-900)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Accesos Rápidos
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {accesosRapidos.map((item) => (
              <Link
                key={item.ruta}
                to={item.ruta}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{item.icono}</span>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      color: 'var(--color-navy-900)',
                      marginBottom: '4px',
                    }}
                  >
                    {item.titulo}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-600)', lineHeight: 1.4 }}>
                    {item.descripcion}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}