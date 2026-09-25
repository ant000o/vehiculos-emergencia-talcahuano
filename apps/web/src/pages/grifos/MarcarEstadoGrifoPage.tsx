import { useEffect, useState, type FormEvent } from 'react';
import { listarGrifos, actualizarEstadoGrifo, type Grifo, type EstadoGrifo } from '../../services/grifos';
import { MapaSeleccionUbicacion } from './MapaSeleccionUbicacion';
import './grifos.css';

const ESTADO_LABEL: Record<EstadoGrifo, string> = {
  operativo: 'Operativo',
  en_mantencion: 'En mantención',
  fuera_de_servicio: 'Fuera de servicio',
};

// Centro de Talcahuano, solo como respaldo si un grifo no tuviera
// coordenadas cargadas todavía.
const CENTRO_TALCAHUANO: [number, number] = [-36.7169, -73.1162];

export function MarcarEstadoGrifoPage() {
  const [grifos, setGrifos] = useState<Grifo[]>([]);
  const [idGrifo, setIdGrifo] = useState<number | null>(null);
  const [estado, setEstado] = useState<EstadoGrifo>('operativo');
  const [lat, setLat] = useState(CENTRO_TALCAHUANO[0]);
  const [lng, setLng] = useState(CENTRO_TALCAHUANO[1]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      const lista = await listarGrifos();
      setGrifos(lista);
      if (lista[0]) {
        aplicarGrifo(lista[0]);
      }
      setIsLoading(false);
    }
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function aplicarGrifo(grifo: Grifo) {
    setIdGrifo(grifo.id_grifo);
    setEstado(grifo.estado_operativo);
    const [lngActual, latActual] = grifo.coordenadas.coordinates;
    setLat(latActual);
    setLng(lngActual);
  }

  function handleSeleccionarGrifo(id: number) {
    const grifo = grifos.find((g) => g.id_grifo === id);
    if (grifo) aplicarGrifo(grifo);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!idGrifo) return;

    setIsSaving(true);
    setError(null);
    setConfirmacion(null);

    try {
      const actualizado = await actualizarEstadoGrifo(idGrifo, {
        coordenadas: { type: 'Point', coordinates: [lng, lat] },
        estado_operativo: estado,
        ultima_revision: new Date().toISOString().slice(0, 10),
      });
      setGrifos((prev) => prev.map((g) => (g.id_grifo === idGrifo ? actualizado : g)));
      setConfirmacion(
        `Grifo #${actualizado.id_grifo} actualizado a "${ESTADO_LABEL[actualizado.estado_operativo]}".`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el grifo.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p>Cargando grifos…</p>;
  }

  return (
    <div className="grifos-page">
      <h1 className="grifos-page__title">Marcar estado de grifo</h1>
      <p className="grifos-page__subtitle">
        Selecciona el grifo, haz clic en el mapa para fijar su ubicación exacta y
        actualiza su estado.
      </p>

      {confirmacion && (
        <p className="grifos-page__success" role="status">
          ✓ {confirmacion}
        </p>
      )}
      {error && (
        <p className="grifos-page__alert" role="alert">
          {error}
        </p>
      )}

      {grifos.length === 0 ? (
        <p className="grifos-page__empty">No hay grifos registrados todavía.</p>
      ) : (
        <form className="grifos-form" onSubmit={handleSubmit}>
          <div className="grifos-form__field">
            <label htmlFor="grifo">Grifo</label>
            <select
              id="grifo"
              value={idGrifo ?? ''}
              onChange={(e) => handleSeleccionarGrifo(Number(e.target.value))}
            >
              {grifos.map((g) => (
                <option key={g.id_grifo} value={g.id_grifo}>
                  #{g.id_grifo} — {g.direccion ?? 'Sin dirección'} ({ESTADO_LABEL[g.estado_operativo]})
                </option>
              ))}
            </select>
          </div>

          <div className="grifos-form__field">
            <label htmlFor="estado">Nuevo estado</label>
            <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoGrifo)}>
              <option value="operativo">Operativo</option>
              <option value="en_mantencion">En mantención</option>
              <option value="fuera_de_servicio">Fuera de servicio</option>
            </select>
          </div>

          <div className="grifos-form__field">
            <label>Ubicación (haz clic en el mapa para actualizarla)</label>
            {/* key={idGrifo}: al cambiar de grifo, el mapa se vuelve a centrar
                desde cero en la ubicación de ese grifo. */}
            <MapaSeleccionUbicacion
              key={idGrifo}
              lat={lat}
              lng={lng}
              onSeleccionar={(nuevaLat, nuevaLng) => {
                setLat(nuevaLat);
                setLng(nuevaLng);
              }}
            />
            <span className="grifos-form__coords">
              Lat: {lat.toFixed(6)} · Lng: {lng.toFixed(6)}
            </span>
          </div>

          <button type="submit" className="grifos-form__submit" disabled={isSaving}>
            {isSaving ? 'Guardando…' : 'Actualizar grifo'}
          </button>
        </form>
      )}
    </div>
  );
}
