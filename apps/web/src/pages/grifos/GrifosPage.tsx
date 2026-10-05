import { useEffect, useState } from 'react';
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
        <GrifosTable
          grifos={grifos}
          companias={companias}
          onVerUbicacion={(grifo) => setGrifoUbicacion(grifo)}
        />
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
