import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import { listarVehiculos, type Vehiculo } from '../../services/vehiculos';
import { crearRegistroOperatividad } from '../../services/registroOperatividad';
import { NivelBadge } from '../../components/NivelBadge';
import './registro-operatividad.css';

export function RegistrarEstadoPage() {
  const { user } = useAuth();

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [idVehiculo, setIdVehiculo] = useState<number | null>(null);
  const [nivelCombustible, setNivelCombustible] = useState(100);
  const [nivelAgua, setNivelAgua] = useState(100);
  const [nivelAceite, setNivelAceite] = useState(100);
  const [observaciones, setObservaciones] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimoRegistro, setUltimoRegistro] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const lista = await listarVehiculos();
        setVehiculos(lista);
        setIdVehiculo(lista[0]?.id_vehiculo ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    cargar();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!idVehiculo || !user) return;

    setIsSaving(true);
    setError(null);
    setUltimoRegistro(null);

    try {
      const registro = await crearRegistroOperatividad({
        fecha_hora_registro: new Date().toISOString(),
        nivel_combustible: nivelCombustible,
        nivel_agua: nivelAgua,
        nivel_aceite: nivelAceite,
        observaciones: observaciones.trim() || undefined,
        id_usuario: user.id,
        id_vehiculo: idVehiculo,
      });
      setUltimoRegistro(
        new Date(registro.fecha_hora_registro).toLocaleString('es-CL'),
      );
      setObservaciones('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el estado.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p style={{ color: 'var(--color-ink-600)', fontFamily: 'var(--font-body)' }}>Cargando vehículos…</p>;
  }

  return (
    <div className="registro-page">
      <h1 className="registro-page__title">Registrar Estado del Vehículo</h1>
      <p className="registro-page__subtitle">
        Reporta los niveles de operatividad y estado general del vehículo antes o después de un servicio.
      </p>

      {ultimoRegistro && (
        <p className="registro-page__success" role="status">
          ✓ Registro guardado exitosamente — {ultimoRegistro}
        </p>
      )}
      {error && (
        <p className="registro-page__alert" role="alert">
          {error}
        </p>
      )}

      <form className="registro-form" onSubmit={handleSubmit}>
        <div className="registro-form__field">
          <label htmlFor="vehiculo">Vehículo a inspeccionar</label>
          <select
            id="vehiculo"
            value={idVehiculo ?? ''}
            onChange={(e) => setIdVehiculo(Number(e.target.value))}
          >
            {vehiculos.map((v) => (
              <option key={v.id_vehiculo} value={v.id_vehiculo}>
                {v.patente} — {v.marca} {v.modelo}
              </option>
            ))}
          </select>
        </div>

        {/* Nivel de Combustible */}
        <div className="registro-form__slider">
          <label htmlFor="combustible" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Nivel de Combustible</span>
            <NivelBadge valor={nivelCombustible} mostrarEtiqueta />
          </label>
          <input
            id="combustible"
            type="range"
            min={0}
            max={100}
            value={nivelCombustible}
            onChange={(e) => setNivelCombustible(Number(e.target.value))}
          />
        </div>

        {/* Nivel de Agua */}
        <div className="registro-form__slider">
          <label htmlFor="agua" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Nivel de Agua</span>
            <NivelBadge valor={nivelAgua} mostrarEtiqueta />
          </label>
          <input
            id="agua"
            type="range"
            min={0}
            max={100}
            value={nivelAgua}
            onChange={(e) => setNivelAgua(Number(e.target.value))}
          />
        </div>

        {/* Nivel de Aceite */}
        <div className="registro-form__slider">
          <label htmlFor="aceite" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Nivel de Aceite</span>
            <NivelBadge valor={nivelAceite} mostrarEtiqueta />
          </label>
          <input
            id="aceite"
            type="range"
            min={0}
            max={100}
            value={nivelAceite}
            onChange={(e) => setNivelAceite(Number(e.target.value))}
          />
        </div>

        <div className="registro-form__field">
          <label htmlFor="observaciones">Observaciones adicionales</label>
          <textarea
            id="observaciones"
            rows={3}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: neumáticos en buen estado, nivel de aceite revisado en frío..."
          />
        </div>

        <button type="submit" className="registro-form__submit" disabled={isSaving || !idVehiculo}>
          {isSaving ? 'Guardando registro…' : 'Guardar Registro de Operatividad'}
        </button>
      </form>
    </div>
  );
}
