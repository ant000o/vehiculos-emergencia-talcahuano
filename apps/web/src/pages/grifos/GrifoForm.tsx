import { useState, type FormEvent } from 'react';
import type { CompaniaOption, EstadoGrifo } from '../../services/grifos';
import { MapaSeleccionUbicacion } from './MapaSeleccionUbicacion';

interface GrifoFormValues {
  direccion?: string;
  estado_operativo: EstadoGrifo;
  id_compania: number;
  coordenadas: { type: 'Point'; coordinates: [number, number] }; // [lat, lng]
}

interface GrifoFormProps {
  companias: CompaniaOption[];
  isSaving: boolean;
  serverError: string | null;
  onSubmit: (values: GrifoFormValues) => void;
  onCancel: () => void;
}

// Centro de Talcahuano, punto de partida para ubicar un grifo nuevo.
const CENTRO_TALCAHUANO: [number, number] = [-36.7169, -73.1162];

export function GrifoForm({ companias, isSaving, serverError, onSubmit, onCancel }: GrifoFormProps) {
  const [direccion, setDireccion] = useState('');
  const [estado, setEstado] = useState<EstadoGrifo>('operativo');
  const [idCompania, setIdCompania] = useState(companias[0]?.id_compania ?? 0);
  const [lat, setLat] = useState(CENTRO_TALCAHUANO[0]);
  const [lng, setLng] = useState(CENTRO_TALCAHUANO[1]);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!idCompania) {
      setError('Selecciona una compañía.');
      return;
    }
    setError(null);
    onSubmit({
      direccion: direccion.trim() || undefined,
      estado_operativo: estado,
      id_compania: idCompania,
      coordenadas: { type: 'Point', coordinates: [lat, lng] },
    });
  }

  return (
    <form className="grifos-form" onSubmit={handleSubmit} noValidate>
      <h2 className="grifos-form__title">Nuevo grifo</h2>

      {serverError && (
        <p className="grifos-form__alert" role="alert">
          {serverError}
        </p>
      )}
      {error && (
        <p className="grifos-form__alert" role="alert">
          {error}
        </p>
      )}

      <div className="grifos-form__field">
        <label htmlFor="direccion">Dirección (opcional)</label>
        <input
          id="direccion"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Ej: Av. Colón esq. Los Alerces"
        />
      </div>

      <div className="grifos-form__field">
        <label htmlFor="estado">Estado</label>
        <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value as EstadoGrifo)}>
          <option value="operativo">Operativo</option>
          <option value="en_mantencion">En mantención</option>
          <option value="fuera_de_servicio">Fuera de servicio</option>
        </select>
      </div>

      <div className="grifos-form__field">
        <label htmlFor="compania">Compañía</label>
        <select
          id="compania"
          value={idCompania}
          onChange={(e) => setIdCompania(Number(e.target.value))}
        >
          {companias.map((c) => (
            <option key={c.id_compania} value={c.id_compania}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="grifos-form__field">
        <label>Ubicación (haz clic en el mapa para fijarla)</label>
        <MapaSeleccionUbicacion
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

      <div className="grifos-form__actions">
        <button type="button" className="grifos-form__cancel" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="grifos-form__submit" disabled={isSaving}>
          {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
