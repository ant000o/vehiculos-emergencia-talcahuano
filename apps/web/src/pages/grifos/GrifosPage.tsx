import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarGrifos,
  listarCompanias,
  crearGrifo,
  type Grifo,
  type CompaniaOption,
  type EstadoGrifo,
} from '../../services/grifos';
import { GrifosTable } from './GrifosTable';
import { GrifoForm } from './GrifoForm';
import { Modal } from '../../components/Modal';
import { MapaVistaUbicacion } from './MapaVistaUbicacion';
import './grifos.css';

type Vista = { modo: 'lista' } | { modo: 'crear' };

interface GrifoFormValues {
  direccion?: string;
  estado_operativo: EstadoGrifo;
  id_compania: number;
  coordenadas: { type: 'Point'; coordinates: [number, number] };
}

export function GrifosPage() {
  const { user } = useAuth();
  const esAdmin = user?.rol === 'administrador';

  const [grifos, setGrifos] = useState<Grifo[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
  const [vista, setVista] = useState<Vista>({ modo: 'lista' });
  const [grifoUbicacion, setGrifoUbicacion] = useState<Grifo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // HU-14: búsqueda por identificador o dirección + exclusión de grifos "Malos"
  // (interpretado como estado_operativo = 'fuera_de_servicio').
  const [busqueda, setBusqueda] = useState('');
  const [excluirMalos, setExcluirMalos] = useState(false);

  const grifosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return grifos.filter((g) => {
      const coincideTexto =
        texto === '' ||
        String(g.id_grifo).includes(texto) ||
        (g.direccion ?? '').toLowerCase().includes(texto);
      const noEsMalo = !excluirMalos || g.estado_operativo !== 'fuera_de_servicio';
      return coincideTexto && noEsMalo;
    });
  }, [grifos, busqueda, excluirMalos]);

  useEffect(() => {
    async function cargarDatos() {
      const [listaGrifos, listaCompanias] = await Promise.all([
        listarGrifos(),
        listarCompanias(),
      ]);
      setGrifos(listaGrifos);
      setCompanias(listaCompanias);
      setIsLoading(false);
    }
    cargarDatos();
  }, []);

  async function handleCrear(values: GrifoFormValues) {
    setIsSaving(true);
    setFormError(null);
    try {
      const nuevo = await crearGrifo(values);
      setGrifos((prev) => [...prev, nuevo]);
      setVista({ modo: 'lista' });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo registrar el grifo.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p>Cargando grifos…</p>;
  }

  return (
    <div className="grifos-page">
      <div className="grifos-page__header">
        <h1 className="grifos-page__title">Grifos</h1>
        {esAdmin && vista.modo === 'lista' && (
          <button
            className="grifos-page__nuevo"
            onClick={() => {
              setFormError(null);
              setVista({ modo: 'crear' });
            }}
          >
            + Nuevo grifo
          </button>
        )}
      </div>

      {vista.modo === 'lista' && (
        <>
          <div className="grifos-page__filtros">
            <input
              type="search"
              className="grifos-page__busqueda"
              placeholder="Buscar por N° de grifo o dirección…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar grifo por identificador o dirección"
            />
            <label className="grifos-page__checkbox">
              <input
                type="checkbox"
                checked={excluirMalos}
                onChange={(e) => setExcluirMalos(e.target.checked)}
              />
              Ocultar grifos fuera de servicio
            </label>
          </div>
          {(busqueda || excluirMalos) && (
            <p className="grifos-page__contador">
              {grifosFiltrados.length} de {grifos.length} grifos
            </p>
          )}

          <GrifosTable
            grifos={grifosFiltrados}
            companias={companias}
            onVerUbicacion={(grifo) => setGrifoUbicacion(grifo)}
          />
        </>
      )}

      {vista.modo === 'crear' && (
        <GrifoForm
          companias={companias}
          isSaving={isSaving}
          serverError={formError}
          onSubmit={handleCrear}
          onCancel={() => setVista({ modo: 'lista' })}
        />
      )}

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
