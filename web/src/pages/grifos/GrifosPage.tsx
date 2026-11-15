import { useEffect, useState } from 'react';
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
import './grifos.css';

export function GrifosPage() {
  const [grifos, setGrifos] = useState<Grifo[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
  const [grifoUbicacion, setGrifoUbicacion] = useState<Grifo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function cargarDatos() {
    try {
      const [listaGrifos, listaCompanias] = await Promise.all([
        listarGrifos(),
        listarCompanias(),
      ]);
      setGrifos(listaGrifos);
      setCompanias(listaCompanias);
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

  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<EstadoGrifo | ''>('');

  const grifosFiltrados = grifos.filter((g) => {
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
          <h1 className="grifos-page__title">Red de Grifos de Talcahuano</h1>
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
      </div>

      <GrifosTable
        grifos={grifosFiltrados}
        companias={companias}
        onVerUbicacion={(grifo) => setGrifoUbicacion(grifo)}
      />

      {grifoUbicacion && (
        <Modal title={`Ubicación — Grifo #${grifoUbicacion.id_grifo}`} onClose={() => setGrifoUbicacion(null)}>
          <MapaVistaUbicacion
            lat={grifoUbicacion.coordenadas.coordinates[0]}
            lng={grifoUbicacion.coordenadas.coordinates[1]}
          />
          <p className="grifos-page__ubicacion-direccion">
            {grifoUbicacion.direccion ?? 'Sin dirección registrada'}
          </p>
        </Modal>
      )}
    </div>
  );
}
