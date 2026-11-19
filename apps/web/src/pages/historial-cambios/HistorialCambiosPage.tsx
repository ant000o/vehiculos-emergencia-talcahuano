import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { listarHistorialCambios, type HistorialCambioItem } from '../../services/auditoria';
import {
  listarUsuarios,
  listarCompanias,
  type Usuario,
  type CompaniaOption,
} from '../../services/usuarios';
import { Modal } from '../../components/Modal';
import './historial-cambios.css';

export function HistorialCambiosPage() {
  const { user, getScope } = useAuth();
  const userRol = (user?.rol || '').toLowerCase().trim();
  const esAdmin = userRol === 'administrador';
  const scope = getScope('dashboard') || (esAdmin ? 'GLOBAL' : 'COMPANY');
  const esAlcanceCompania = scope === 'COMPANY' && Boolean(user?.id_compania);
  const puedeVerTodasCompanias = scope === 'GLOBAL' || esAdmin;

  const [registros, setRegistros] = useState<HistorialCambioItem[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
  const [tablaFiltro, setTablaFiltro] = useState<string>('todos');
  const [accionFiltro, setAccionFiltro] = useState<string>('todos');
  const [idCompania, setIdCompania] = useState<string>(() => {
    return esAlcanceCompania && user?.id_compania ? String(user.id_compania) : '';
  });
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [detalleModal, setDetalleModal] = useState<HistorialCambioItem | null>(null);

  const cargarDatos = () => {
    setIsLoading(true);
    Promise.all([
      listarHistorialCambios({ limit: 150 }),
      listarUsuarios().catch(() => []),
      listarCompanias().catch(() => []),
    ])
      .then(([data, listaUsuarios, listaCompanias]) => {
        setRegistros(data);
        setUsuarios(listaUsuarios);
        setCompanias(
          [...listaCompanias].sort(
            (a, b) => (a.numero_compania ?? a.id_compania) - (b.numero_compania ?? b.id_compania),
          ),
        );
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const mapaUsuarios = useMemo(() => {
    const map = new Map<number, Usuario>();
    usuarios.forEach((u) => map.set(u.id_usuario, u));
    return map;
  }, [usuarios]);

  const mapaCompanias = useMemo(() => {
    const map = new Map<number, CompaniaOption>();
    companias.forEach((c) => map.set(c.id_compania, c));
    return map;
  }, [companias]);

  const tablasDisponibles = useMemo(() => {
    const set = new Set(registros.map((r) => r.tabla_afectada));
    return ['todos', ...Array.from(set).sort()];
  }, [registros]);

  function resolverNombreUsuario(idUsuario?: number | null) {
    if (!idUsuario) return 'Sistema / Trigger';
    const u = mapaUsuarios.get(idUsuario);
    return u ? `${u.nombre} ${u.apellidos}` : `Usuario #${idUsuario}`;
  }

  function resolverNombreCompania(idCia?: number | null) {
    if (!idCia) return '—';
    const c = mapaCompanias.get(idCia);
    if (!c) return `Cía #${idCia}`;
    return c.numero_compania
      ? `${c.numero_compania}ª Cía. — ${c.nombre.replace(/^.*Compañía\s*/i, '')}`
      : c.nombre;
  }

  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      // Si el alcance es COMPANY, restringir a los eventos de su compañía
      if (esAlcanceCompania && user?.id_compania) {
        if (r.id_compania && r.id_compania !== user.id_compania) return false;
      } else if (idCompania) {
        if (String(r.id_compania) !== idCompania) return false;
      }

      const matchTabla = tablaFiltro === 'todos' || r.tabla_afectada === tablaFiltro;
      const matchAccion = accionFiltro === 'todos' || r.accion === accionFiltro;

      const q = busqueda.toLowerCase().trim();
      if (!q) return matchTabla && matchAccion;

      const nombreUsuario = resolverNombreUsuario(r.id_usuario).toLowerCase();
      const nombreCia = resolverNombreCompania(r.id_compania).toLowerCase();

      const matchBusqueda =
        r.tabla_afectada.toLowerCase().includes(q) ||
        String(r.id_registro).toLowerCase().includes(q) ||
        r.accion.toLowerCase().includes(q) ||
        nombreUsuario.includes(q) ||
        nombreCia.includes(q);

      return matchTabla && matchAccion && matchBusqueda;
    });
  }, [
    registros,
    tablaFiltro,
    accionFiltro,
    idCompania,
    busqueda,
    esAlcanceCompania,
    user?.id_compania,
    mapaUsuarios,
    mapaCompanias,
  ]);

  function formatoFecha(iso: string) {
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    } catch {
      return iso;
    }
  }

  function renderBadgeAccion(accion: string) {
    const up = accion.toUpperCase();
    let clase = 'is-update';
    if (up.includes('INSERT')) clase = 'is-insert';
    if (up.includes('DELETE')) clase = 'is-delete';
    return <span className={`accion-badge ${clase}`}>{up}</span>;
  }

  return (
    <div className="auditoria-page">
      <div className="auditoria-page__header">
        <div>
          <h1 className="auditoria-page__title">
            {esAlcanceCompania && user?.compania
              ? `Auditoría de Cambios — ${user.compania}`
              : 'Historial de Cambios y Auditoría'}
          </h1>
          <p className="auditoria-page__desc">
            Registro cronológico inmutable de inserciones, modificaciones y eliminaciones en el sistema institucional.
          </p>
        </div>
        <button
          type="button"
          onClick={cargarDatos}
          style={{
            padding: '8px 16px',
            background: 'var(--color-navy-900)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="auditoria-filtros">
        <input
          type="text"
          placeholder="Buscar por tabla, ID, responsable o compañía..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ minWidth: 260 }}
        />

        {/* Filtro de Compañía: visible solo si el alcance es GLOBAL */}
        {puedeVerTodasCompanias && (
          <select
            style={{
              maxWidth: '220px',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
            value={idCompania}
            onChange={(e) => setIdCompania(e.target.value)}
          >
            <option value="">Todas las compañías</option>
            {companias.map((c) => (
              <option key={c.id_compania} value={c.id_compania} title={c.nombre}>
                {c.numero_compania
                  ? `${c.numero_compania}ª Cía. — ${c.nombre.replace(/^.*Compañía\s*/i, '')}`
                  : c.nombre}
              </option>
            ))}
          </select>
        )}

        <select
          value={tablaFiltro}
          onChange={(e) => setTablaFiltro(e.target.value)}
        >
          <option value="todos">Todas las tablas</option>
          {tablasDisponibles
            .filter((t) => t !== 'todos')
            .map((t) => (
              <option key={t} value={t}>
                Tabla: {t}
              </option>
            ))}
        </select>

        <select
          value={accionFiltro}
          onChange={(e) => setAccionFiltro(e.target.value)}
        >
          <option value="todos">Todas las acciones</option>
          <option value="INSERT">INSERT (Creaciones)</option>
          <option value="UPDATE">UPDATE (Modificaciones)</option>
          <option value="DELETE">DELETE (Eliminaciones)</option>
        </select>

        <span style={{ fontSize: '0.875rem', color: 'var(--color-ink-500)', marginLeft: 'auto' }}>
          {filtrados.length} {filtrados.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="auditoria-table-wrap">
        <table className="auditoria-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Acción</th>
              <th>Tabla Afectada</th>
              <th>ID Registro</th>
              <th>Responsable</th>
              <th>Compañía</th>
              <th style={{ textAlign: 'center' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                  Cargando historial de cambios…
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-ink-500)' }}>
                  No hay registros de auditoría que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              filtrados.map((item) => (
                <tr key={item.id_historial}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                    {formatoFecha(item.fecha_hora)}
                  </td>
                  <td>{renderBadgeAccion(item.accion)}</td>
                  <td>
                    <strong>{item.tabla_afectada}</strong>
                  </td>
                  <td>
                    <code>{item.id_registro}</code>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {item.id_usuario ? (
                      <span>👤 {resolverNombreUsuario(item.id_usuario)}</span>
                    ) : (
                      <span style={{ color: 'var(--color-ink-400)' }}>Sistema / Trigger</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {resolverNombreCompania(item.id_compania)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="auditoria-btn-ver"
                      onClick={() => setDetalleModal(item)}
                    >
                      Ver valores
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detalleModal && (
        <Modal
          title={`Detalle de Auditoría #${detalleModal.id_historial} — ${detalleModal.accion} en ${detalleModal.tabla_afectada}`}
          onClose={() => setDetalleModal(null)}
        >
          <div style={{ marginBottom: '12px', fontSize: '0.875rem' }}>
            <p style={{ margin: '0 0 6px 0' }}>
              <strong>Registro afectado:</strong> <code>{detalleModal.id_registro}</code> |{' '}
              <strong>Responsable:</strong> {resolverNombreUsuario(detalleModal.id_usuario)} |{' '}
              <strong>Fecha:</strong> {formatoFecha(detalleModal.fecha_hora)}
            </p>
          </div>

          <div className="diff-grid">
            <div className="diff-col">
              <h4>Valores Anteriores (Pre-cambio)</h4>
              <pre className="diff-pre">
                {detalleModal.valores_anteriores
                  ? JSON.stringify(detalleModal.valores_anteriores, null, 2)
                  : '(Ninguno / Registro nuevo)'}
              </pre>
            </div>

            <div className="diff-col">
              <h4>Valores Nuevos (Post-cambio)</h4>
              <pre className="diff-pre">
                {detalleModal.valores_nuevos
                  ? JSON.stringify(detalleModal.valores_nuevos, null, 2)
                  : '(Ninguno / Registro eliminado)'}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}