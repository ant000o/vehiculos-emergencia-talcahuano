import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import { listarVehiculos, type Vehiculo } from '../../services/vehiculos';
import { registrarMantencionReactiva } from '../../services/mantenciones';

interface FormErrors {
  descripcion?: string;
  costo?: string;
}

export function RegistrarFallaForm() {
  const { user } = useAuth();

  // Acá SÍ se muestran todos los vehículos (no solo los "en mantención"):
  // una falla puede ocurrir en cualquier vehículo que hasta ahora estaba
  // operativo — es justo lo que se está reportando recién.
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [idVehiculo, setIdVehiculo] = useState<number | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [costoManoObra, setCostoManoObra] = useState<number | ''>('');
  const [errors, setErrors] = useState<FormErrors>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patenteConfirmada, setPatenteConfirmada] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      const lista = await listarVehiculos();
      setVehiculos(lista);
      setIdVehiculo(lista[0]?.id_vehiculo ?? null);
      setIsLoading(false);
    }
    cargar();
  }, []);

  function validar(): boolean {
    const nuevosErrores: FormErrors = {};
    // La HU pide explícitamente "descripción técnica" y "costo numérico"
    // como parte del criterio de éxito — ambos van requeridos acá, a
    // diferencia del formulario de mantención preventiva donde son opcionales.
    if (!descripcion.trim()) {
      nuevosErrores.descripcion = 'Describe técnicamente la falla detectada.';
    }
    if (costoManoObra === '' || Number(costoManoObra) < 0) {
      nuevosErrores.costo = 'Ingresa el costo de mano de obra (puede ser 0).';
    }
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!idVehiculo || !user || !validar()) return;

    const vehiculoActual = vehiculos.find((v) => v.id_vehiculo === idVehiculo);

    setIsSaving(true);
    setError(null);
    setPatenteConfirmada(null);

    try {
      await registrarMantencionReactiva({
        descripcion_falla: descripcion.trim(),
        costo_mano_obra: Number(costoManoObra),
        id_vehiculo: idVehiculo,
        id_usuario_mecanico: user.id,
      });

      setPatenteConfirmada(vehiculoActual?.patente ?? null);
      setDescripcion('');
      setCostoManoObra('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la falla.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p>Cargando vehículos…</p>;
  }

  return (
    <div>
      <p className="mantenciones-page__subtitle">
        Documenta una falla detectada. El registro queda en estado "En proceso"
        — el cambio de estado del vehículo lo define el Administrador
        manualmente, según corresponda.
      </p>

      {patenteConfirmada && (
        <p className="mantenciones-page__success" role="status">
          ✓ Falla registrada para {patenteConfirmada}.
        </p>
      )}
      {error && (
        <p className="mantenciones-page__alert" role="alert">
          {error}
        </p>
      )}

      <form className="mantenciones-form" onSubmit={handleSubmit} noValidate>
        <div className="mantenciones-form__field">
          <label htmlFor="vehiculo-falla">Vehículo</label>
          <select
            id="vehiculo-falla"
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

        <div className="mantenciones-form__field">
          <label htmlFor="descripcion-falla">Descripción técnica de la falla</label>
          <textarea
            id="descripcion-falla"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: bomba de agua no presuriza, posible falla en sello mecánico…"
            aria-invalid={Boolean(errors.descripcion)}
          />
          {errors.descripcion && (
            <span className="mantenciones-form__error">{errors.descripcion}</span>
          )}
        </div>

        <div className="mantenciones-form__field">
          <label htmlFor="costo-falla">Costo de mano de obra (CLP)</label>
          <input
            id="costo-falla"
            type="number"
            min={0}
            value={costoManoObra}
            onChange={(e) => setCostoManoObra(e.target.value === '' ? '' : Number(e.target.value))}
            aria-invalid={Boolean(errors.costo)}
          />
          {errors.costo && <span className="mantenciones-form__error">{errors.costo}</span>}
        </div>

        <button type="submit" className="mantenciones-form__submit" disabled={isSaving || !idVehiculo}>
          {isSaving ? 'Guardando…' : 'Registrar falla'}
        </button>
      </form>
    </div>
  );
}
