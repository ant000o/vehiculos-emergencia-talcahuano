import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import { listarVehiculos, type Vehiculo } from '../../services/vehiculos';
import { registrarMantencionPreventivaFinalizada } from '../../services/mantenciones';

export function MantencionPreventivaForm() {
  const { user } = useAuth();

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [idVehiculo, setIdVehiculo] = useState<number | null>(null);
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [fechaSalida, setFechaSalida] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [costoManoObra, setCostoManoObra] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patenteConfirmada, setPatenteConfirmada] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      const lista = await listarVehiculos();
      const enMantencion = lista.filter((v) => v.estado_operativo === 'en_mantencion');
      setVehiculos(enMantencion);
      setIdVehiculo(enMantencion[0]?.id_vehiculo ?? null);
      setIsLoading(false);
    }
    cargar();
  }, []);

  function validarFechas(): string | null {
    if (!fechaIngreso) return 'Ingresa la fecha de inicio.';
    if (!fechaSalida) return 'Ingresa la fecha de término.';
    if (new Date(fechaSalida) < new Date(fechaIngreso)) {
      return 'La fecha de término no puede ser anterior a la de inicio.';
    }
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!idVehiculo || !user) return;

    const errorFechas = validarFechas();
    if (errorFechas) {
      setError(errorFechas);
      return;
    }

    const vehiculoActual = vehiculos.find((v) => v.id_vehiculo === idVehiculo);

    setIsSaving(true);
    setError(null);
    setPatenteConfirmada(null);

    try {
      await registrarMantencionPreventivaFinalizada({
        fecha_ingreso: new Date(fechaIngreso).toISOString(),
        fecha_salida: new Date(fechaSalida).toISOString(),
        descripcion_falla: descripcion.trim() || undefined,
        costo_mano_obra: costoManoObra,
        id_vehiculo: idVehiculo,
        id_usuario_mecanico: user.id,
      });

      setPatenteConfirmada(vehiculoActual?.patente ?? null);
      setDescripcion('');
      setCostoManoObra(0);
      setFechaIngreso('');
      setFechaSalida('');

      setVehiculos((prev) => {
        const restantes = prev.filter((v) => v.id_vehiculo !== idVehiculo);
        setIdVehiculo(restantes[0]?.id_vehiculo ?? null);
        return restantes;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la mantención.');
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
        Al guardar, la mantención queda marcada como finalizada y el vehículo vuelve a
        quedar disponible (operativo) automáticamente.
      </p>

      {patenteConfirmada && (
        <p className="mantenciones-page__success" role="status">
          ✓ Mantención registrada — {patenteConfirmada} vuelve a estar <strong>Operativo</strong>.
        </p>
      )}
      {error && (
        <p className="mantenciones-page__alert" role="alert">
          {error}
        </p>
      )}

      {vehiculos.length === 0 ? (
        <p className="mantenciones-page__empty">
          No hay vehículos en mantención actualmente. Para registrar una mantención
          finalizada, primero un Administrador debe marcar el vehículo como
          "En mantención" desde la ficha del vehículo.
        </p>
      ) : (
        <form className="mantenciones-form" onSubmit={handleSubmit}>
          <div className="mantenciones-form__field">
            <label htmlFor="vehiculo-preventiva">Vehículo</label>
            <select
              id="vehiculo-preventiva"
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

          <div className="mantenciones-form__row">
            <div className="mantenciones-form__field">
              <label htmlFor="fecha-ingreso">Fecha de inicio</label>
              <input
                id="fecha-ingreso"
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
              />
            </div>
            <div className="mantenciones-form__field">
              <label htmlFor="fecha-salida">Fecha de término</label>
              <input
                id="fecha-salida"
                type="date"
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
              />
            </div>
          </div>

          <div className="mantenciones-form__field">
            <label htmlFor="descripcion-preventiva">Trabajo realizado (opcional)</label>
            <textarea
              id="descripcion-preventiva"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: cambio de aceite y filtros, revisión de frenos…"
            />
          </div>

          <div className="mantenciones-form__field">
            <label htmlFor="costo-preventiva">Costo mano de obra (CLP)</label>
            <input
              id="costo-preventiva"
              type="number"
              min={0}
              value={costoManoObra}
              onChange={(e) => setCostoManoObra(Number(e.target.value))}
            />
          </div>

          <button type="submit" className="mantenciones-form__submit" disabled={isSaving || !idVehiculo}>
            {isSaving ? 'Guardando…' : 'Registrar mantención finalizada'}
          </button>
        </form>
      )}
    </div>
  );
}
