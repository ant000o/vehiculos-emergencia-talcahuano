import { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarGrifos,
  listarCompanias,
  type Grifo,
  type CompaniaOption,
  type EstadoGrifo,
} from '../../services/grifos';
import { GrifosTable } from './GrifosTable';
import { Modal } from '../../components/Modal';
import { MapaVistaUbicacion } from './MapaVistaUbicacion';
import { normalizarCoordenadas } from '../../utils/emergencia';
import './grifos.css';

export function GrifosPage() {
  const { user, getScope } = useAuth();
  const userRol = (user?.rol || '').toLowerCase().trim();
  const esAdmin = userRol === 'administrador';
  const scope = getScope('grifos');
  const esAlcanceCompania = scope === 'COMPANY' && Boolean(user?.id_compania);
  const puedeVerTodasCompanias = scope === 'GLOBAL' || esAdmin;

  const [grifos, setGrifos] = useState<Grifo[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
  const [grifoUbicacion, setGrifoUbicacion] = useState<Grifo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<EstadoGrifo | ''>('');
  const [idCompania, setIdCompania] = useState<string>(() => {
    return esAlcanceCompania && user?.id_compania ? String(user.id_compania) : '';
  });

  async function cargarDatos() {
    try {
      const [listaGrifos, listaCompanias] = await Promise.all([
        listarGrifos(),
        listarCompanias(),
      ]);
      setGrifos(listaGrifos);
      setCompanias(
        [...listaCompanias].sort(
          (a, b) => (a.numero_compania ?? a.id_compania) - (b.numero_compania ?? b.id_compania),
        ),
      );
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar los grifos.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const grifosFiltrados = grifos.filter((g) => {
    // Si el alcance es COMPANY, acotado estrictamente a su propia compañía
    if (esAlcanceCompania && user?.id_compania && g.id_compania !== user.id_compania) {
      return false;
    }
    // Filtro por compañía seleccionada para alcance GLOBAL
    if (idCompania && String(g.id_compania) !== idCompania) {
      return false;
    }
    const matchEstado = !estado || g.estado_operativo === estado;
    const matchQ =
      !q ||
      g.id_grifo.toString().includes(q.trim()) ||
      (g.direccion && g.direccion.toLowerCase().includes(q.toLowerCase().trim()));
    return matchEstado && matchQ;
  });

  if (isLoading) {
    return <p>Cargando grifos…</p>;
  }

  if (loadError) {
    return <p className="grifos-page__alert" role="alert">{loadError}</p>;
  }

  return (
    <div className="grifos-page">
      <div className="grifos-page__header">
        <div>
          <h1 className="grifos-page__title">
            {esAlcanceCompania && user?.compania
              ? `Red de Grifos — ${user.compania}`
              : 'Red de Grifos de Talcahuano'}
          </h1>
          <p style={{ margin: 'var(--space-1) 0 0', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-ink-500)' }}>
            Catálogo y geolocalización de grifos operativos y puntos de abastecimiento de agua para emergencias.
          </p>
        </div>
      </div>

      <div className="grifos-page__filtros">
        <input
          type="text"
          className="grifos-page__filtro-input"
          placeholder="Buscar por identificador (#) o dirección..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {/* Filtro de Compañía: visible solo si el alcance es GLOBAL */}
        {puedeVerTodasCompanias && (
          <select
            className="grifos-page__filtro-select"
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
          className="grifos-page__filtro-select"
          value={estado}
          onChange={(e) => setEstado(e.target.value as EstadoGrifo | '')}
        >
          <option value="">Todos los estados</option>
          <option value="operativo">Operativo</option>
          <option value="en_mantencion">En mantención</option>
          <option value="fuera_de_servicio">Fuera de servicio</option>
        </select>

        {esAlcanceCompania && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: '1px solid #bfdbfe',
            }}
          >
            🏢 {user?.compania || 'Mi Compañía'}
          </span>
        )}
      </div>

      <GrifosTable
        grifos={grifosFiltrados}
        companias={companias}
        onVerUbicacion={(grifo) => setGrifoUbicacion(grifo)}
      />

      {grifoUbicacion && (() => {
        const coords = normalizarCoordenadas(grifoUbicacion.coordenadas) ?? [-36.7247, -73.1126];
        return (
          <Modal title={`Ubicación — Grifo #${grifoUbicacion.id_grifo}`} onClose={() => setGrifoUbicacion(null)}>
            <MapaVistaUbicacion
              lat={coords[0]}
              lng={coords[1]}
            />
            <p className="grifos-page__ubicacion-direccion">
              {grifoUbicacion.direccion ?? 'Sin dirección registrada'}
            </p>
          </Modal>
        );
      })()}
    </div>
  );
}