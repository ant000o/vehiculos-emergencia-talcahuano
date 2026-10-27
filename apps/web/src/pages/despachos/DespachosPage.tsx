import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { listarDespachos, cambiarEstadoDespacho, type DespachoEmergencia } from '../../services/despachos';
import { useAuth } from '../../context/useAuth';
import './despachos.css';

const ESTADOS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  en_curso: { label: 'En Curso', bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
  controlada: { label: 'Controlada', bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
  finalizada: { label: 'Finalizada', bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  cancelada: { label: 'Cancelada', bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

const ROL_LABELS: Record<string, string> = {
  conductor: 'Conductor',
  brigadista: 'Brigadista',
  jefe_despacho: 'Jefe de Despacho',
};

export function DespachosPage() {
  const { user } = useAuth();
  const [despachos, setDespachos] = useState<DespachoEmergencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState<'activos' | 'historico'>('activos');
  
  // Filtros para el histórico
  const [filtroFecha, setFiltroFecha] = useState<string>('');
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const cargarDespachos = async () => {
    try {
      setCargando(true);
      const data = await listarDespachos();
      setDespachos(data);
    } catch (err) {
      console.error('Error al cargar despachos:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDespachos();
  }, []);

  const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
    const confirmMsg = nuevoEstado === 'finalizada'
      ? '¿Marcar este despacho como FINALIZADO? La unidad y personal volverán a estar operativos.'
      : `¿Cambiar el estado del despacho a ${nuevoEstado}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await cambiarEstadoDespacho(id, nuevoEstado);
      await cargarDespachos();
    } catch (err) {
      console.error('Error al actualizar despacho:', err);
      alert('Error al actualizar el estado del despacho.');
    }
  };

  // Despachos activos (en_curso o controlada)
  const despachosActivos = useMemo(() => {
    return despachos.filter((d) => d.estado_emergencia === 'en_curso' || d.estado_emergencia === 'controlada');
  }, [despachos]);

  // Histórico con filtros (por fecha, texto y estado)
  const despachosHistorico = useMemo(() => {
    return despachos.filter((d) => {
      // Filtro por fecha (YYYY-MM-DD)
      if (filtroFecha) {
        const fechaDespacho = new Date(d.fecha_hora_despacho).toISOString().slice(0, 10);
        if (fechaDespacho !== filtroFecha) return false;
      }

      // Filtro por estado
      if (filtroEstado !== 'todos' && d.estado_emergencia !== filtroEstado) {
        return false;
      }

      // Filtro por texto (tipo emergencia, patente, compañía o personal)
      if (filtroTexto.trim()) {
        const query = filtroTexto.toLowerCase();
        const tipoMatch = d.tipo_emergencia?.toLowerCase().includes(query);
        const patenteMatch = d.vehiculo?.patente?.toLowerCase().includes(query);
        const companiaMatch = d.compania?.nombre?.toLowerCase().includes(query);
        const tripulacionMatch = d.tripulacion?.some((t) =>
          `${t.usuario?.nombre} ${t.usuario?.apellidos}`.toLowerCase().includes(query)
        );
        return tipoMatch || patenteMatch || companiaMatch || tripulacionMatch;
      }

      return true;
    });
  }, [despachos, filtroFecha, filtroTexto, filtroEstado]);

  const esAdminOCapitan = user?.rol === 'administrador' || user?.rol === 'capitan';

  const formatFechaHora = (fechaStr: string) => {
    try {
      const f = new Date(fechaStr);
      return f.toLocaleString('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return fechaStr;
    }
  };

  const renderCard = (d: DespachoEmergencia) => {
    const estadoCfg = ESTADOS_CONFIG[d.estado_emergencia] || {
      label: d.estado_emergencia,
      bg: '#f1f5f9',
      text: '#475569',
      border: '#cbd5e1',
    };

    const cardClassModifier =
      d.estado_emergencia === 'en_curso'
        ? 'despacho-card--activo'
        : d.estado_emergencia === 'finalizada'
        ? 'despacho-card--finalizado'
        : d.estado_emergencia === 'controlada'
        ? 'despacho-card--controlado'
        : 'despacho-card--cancelado';

    return (
      <div key={d.id_despacho} className={`despacho-card ${cardClassModifier}`}>
        <div className="despacho-card__header">
          <div>
            <div className="despacho-card__id">Despacho #{d.id_despacho}</div>
            <h3 className="despacho-card__tipo">{d.tipo_emergencia}</h3>
          </div>
          <span
            className="despacho-card__badge"
            style={{
              backgroundColor: estadoCfg.bg,
              color: estadoCfg.text,
              border: `1px solid ${estadoCfg.border}`,
            }}
          >
            {estadoCfg.label}
          </span>
        </div>

        <div className="despacho-card__body">
          <div className="despacho-card__row">
            <span className="despacho-card__icon">📅</span>
            <span><strong>Fecha/Hora:</strong> {formatFechaHora(d.fecha_hora_despacho)}</span>
          </div>

          <div className="despacho-card__row">
            <span className="despacho-card__icon">🚒</span>
            <div>
              <strong>Unidad:</strong>{' '}
              {d.vehiculo ? (
                <>
                  <span className="despacho-card__vehiculo-badge">{d.vehiculo.patente}</span>
                  <span style={{ marginLeft: 6, color: 'var(--color-ink-600)' }}>
                    ({d.vehiculo.marca} {d.vehiculo.modelo})
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--color-ink-400)' }}>Sin unidad asignada</span>
              )}
            </div>
          </div>

          <div className="despacho-card__row">
            <span className="despacho-card__icon">🏢</span>
            <span><strong>Compañía:</strong> {d.compania?.nombre || 'Central Talcahuano'}</span>
          </div>

          {d.grifo && (
            <div className="despacho-card__row">
              <span className="despacho-card__icon">🚰</span>
              <span><strong>Grifo de Apoyo:</strong> #{d.grifo.id_grifo} ({d.grifo.direccion || 'Asignado'})</span>
            </div>
          )}

          {/* Tripulación asignada */}
          <div className="despacho-card__crew-box">
            <div className="despacho-card__crew-title">
              <span>Personal Asignado</span>
              <span>{d.tripulacion?.length || 0} tripulantes</span>
            </div>
            {d.tripulacion && d.tripulacion.length > 0 ? (
              <div className="despacho-card__crew-list">
                {d.tripulacion.map((t, idx) => (
                  <span key={`${d.id_despacho}-${t.id_usuario}-${t.rol_en_despacho || idx}`} className="despacho-card__crew-item">
                    <span className="despacho-card__crew-role">[{ROL_LABELS[t.rol_en_despacho] || t.rol_en_despacho}]</span>
                    <span>{t.usuario ? `${t.usuario.nombre} ${t.usuario.apellidos}` : `ID #${t.id_usuario}`}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-400)', fontStyle: 'italic' }}>
                Sin personal registrado en este despacho
              </span>
            )}
          </div>
        </div>

        {/* Acciones para Comandancia / Admin */}
        {esAdminOCapitan && (
          <div className="despacho-card__actions">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {d.estado_emergencia === 'en_curso' && (
                <>
                  <button
                    className="despacho-card__btn-status"
                    onClick={() => handleCambiarEstado(d.id_despacho, 'controlada')}
                  >
                    Controlar
                  </button>
                  <button
                    className="despacho-card__btn-status despacho-card__btn-finalize"
                    onClick={() => handleCambiarEstado(d.id_despacho, 'finalizada')}
                  >
                    ✓ Finalizar
                  </button>
                </>
              )}
              {d.estado_emergencia === 'controlada' && (
                <button
                  className="despacho-card__btn-status despacho-card__btn-finalize"
                  onClick={() => handleCambiarEstado(d.id_despacho, 'finalizada')}
                >
                  ✓ Finalizar Emergencia
                </button>
              )}
              {d.estado_emergencia !== 'en_curso' && d.estado_emergencia !== 'controlada' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-400)' }}>
                  Emergencia cerrada
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="despachos-page">
      <div className="despachos__header">
        <div>
          <h1 className="despachos__title">Panel de Despachos de Emergencia</h1>
          <p className="despachos__subtitle">
            Monitorea en tiempo real los despachos activos y consulta el histórico detallado por día.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={cargarDespachos}
            className="despachos__btn-clear"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            🔄 Actualizar
          </button>
          {esAdminOCapitan && (
            <Link
              to="/mapa"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--color-white)',
                backgroundColor: 'var(--color-red-600)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 16px',
                textDecoration: 'none',
              }}
            >
              🗺️ Nuevo Despacho en Mapa
            </Link>
          )}
        </div>
      </div>

      {/* Tabs Activos vs Histórico */}
      <div className="despachos__tabs">
        <button
          className={`despachos__tab-btn ${tabActiva === 'activos' ? 'despachos__tab-btn--active' : ''}`}
          onClick={() => setTabActiva('activos')}
        >
          🚨 Despachos en Curso (Activos)
          <span className="despachos__tab-badge despachos__tab-badge--red">
            {despachosActivos.length}
          </span>
        </button>

        <button
          className={`despachos__tab-btn ${tabActiva === 'historico' ? 'despachos__tab-btn--active' : ''}`}
          onClick={() => setTabActiva('historico')}
        >
          📜 Histórico de Despachos
          <span className="despachos__tab-badge despachos__tab-badge--gray">
            {despachos.length}
          </span>
        </button>
      </div>

      {/* Filtros específicos si está en la pestaña de Histórico */}
      {tabActiva === 'historico' && (
        <div className="despachos__filters-bar">
          <div className="despachos__filter-group">
            <label className="despachos__filter-label">Buscar por Día</label>
            <input
              type="date"
              className="despachos__input"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </div>

          <div className="despachos__filter-group" style={{ flex: '1 1 220px' }}>
            <label className="despachos__filter-label">Buscar por Tipo, Patente, Personal</label>
            <input
              type="text"
              placeholder="Ej: Fuego, BBBB11, Carlos..."
              className="despachos__input"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>

          <div className="despachos__filter-group">
            <label className="despachos__filter-label">Estado</label>
            <select
              className="despachos__input"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="en_curso">En Curso</option>
              <option value="controlada">Controlada</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {(filtroFecha || filtroTexto || filtroEstado !== 'todos') && (
            <button
              className="despachos__btn-clear"
              onClick={() => {
                setFiltroFecha('');
                setFiltroTexto('');
                setFiltroEstado('todos');
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Renderizado de tarjetas */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-ink-500)' }}>
          Cargando despachos...
        </div>
      ) : tabActiva === 'activos' ? (
        <div className="despachos__cards-grid">
          {despachosActivos.length === 0 ? (
            <div className="despachos__empty">
              <div className="despachos__empty-icon">✅</div>
              <h3 style={{ margin: '0 0 var(--space-1)', color: 'var(--color-navy-900)' }}>
                No hay emergencias en curso actualmente
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Todas las unidades se encuentran operativas en cuartel o listas para despacho.
              </p>
            </div>
          ) : (
            despachosActivos.map(renderCard)
          )}
        </div>
      ) : (
        <div className="despachos__cards-grid">
          {despachosHistorico.length === 0 ? (
            <div className="despachos__empty">
              <div className="despachos__empty-icon">🔍</div>
              <h3 style={{ margin: '0 0 var(--space-1)', color: 'var(--color-navy-900)' }}>
                No se encontraron despachos en el histórico
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Prueba ajustando los filtros de fecha o búsqueda de texto.
              </p>
            </div>
          ) : (
            despachosHistorico.map(renderCard)
          )}
        </div>
      )}
    </div>
  );
}
