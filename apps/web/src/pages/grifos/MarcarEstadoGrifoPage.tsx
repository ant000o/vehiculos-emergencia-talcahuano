import { useEffect, useState, type FormEvent } from 'react';
import { listarGrifos, actualizarEstadoGrifo, type Grifo, type EstadoGrifo } from '../../services/grifos';
import './grifos.css';

const ESTADO_LABEL: Record<EstadoGrifo, string> = {
  operativo: 'Operativo',
  en_mantencion: 'En mantención',
  fuera_de_servicio: 'Fuera de servicio',
};

export function MarcarEstadoGrifoPage() {
  const [grifos, setGrifos] = useState<Grifo[]>([]);
  const [idGrifo, setIdGrifo] = useState<number | null>(null);
  const [estado, setEstado] = useState<EstadoGrifo>('operativo');
  const [lat, setLat] = useState<number | ''>('');
  const [lng, setLng] = useState<number | ''>('');
  const [ubicandoGPS, setUbicandoGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      const lista = await listarGrifos();
      setGrifos(lista);
      if (lista[0]) {
        setIdGrifo(lista[0].id_grifo);
        setEstado(lista[0].estado_operativo);
      }
      setIsLoading(false);
    }
    cargar();
  }, []);

  function handleSeleccionarGrifo(id: number) {
    setIdGrifo(id);
    const grifo = grifos.find((g) => g.id_grifo === id);
    if (grifo) setEstado(grifo.estado_operativo);
    setLat('');
    setLng('');
  }

  function capturarUbicacionActual() {
    if (!navigator.geolocation) {
      setGpsError('Este navegador no soporta geolocalización. Ingresa las coordenadas manualmente.');
      return;
    }
    setUbicandoGPS(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(Number(position.coords.latitude.toFixed(6)));
        setLng(Number(position.coords.longitude.toFixed(6)));
        setUbicandoGPS(false);
      },
      () => {
        setGpsError('No se pudo obtener tu ubicación. Puedes ingresarla manualmente.');
        setUbicandoGPS(false);
      },
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!idGrifo) return;
    if (lat === '' || lng === '') {
      setError('Captura tu ubicación (botón GPS) o ingrésala manualmente antes de guardar.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setConfirmacion(null);

    try {
      const actualizado = await actualizarEstadoGrifo(idGrifo, {
        coordenadas: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
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
        Selecciona el grifo en el que te encuentras, confirma tu ubicación y actualiza su estado.
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

          <div className="grifos-form__ubicacion">
            <button type="button" className="grifos-form__gps" onClick={capturarUbicacionActual} disabled={ubicandoGPS}>
              {ubicandoGPS ? 'Obteniendo ubicación…' : '📍 Usar mi ubicación actual'}
            </button>
            {gpsError && <span className="grifos-form__gps-error">{gpsError}</span>}

            <div className="grifos-form__row">
              <div className="grifos-form__field">
                <label htmlFor="lat">Latitud</label>
                <input
                  id="lat"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="-36.719"
                />
              </div>
              <div className="grifos-form__field">
                <label htmlFor="lng">Longitud</label>
                <input
                  id="lng"
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="-73.116"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="grifos-form__submit" disabled={isSaving}>
            {isSaving ? 'Guardando…' : 'Actualizar grifo'}
          </button>
        </form>
      )}
    </div>
  );
}
