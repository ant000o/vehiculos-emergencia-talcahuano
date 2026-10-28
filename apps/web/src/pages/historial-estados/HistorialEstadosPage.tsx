import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import { listarVehiculos, type Vehiculo } from '../../services/vehiculos';
import { listarRegistros, crearRegistroOperatividad, type RegistroOperatividad } from '../../services/registroOperatividad';
import { NivelBadge } from '../../components/NivelBadge';
import './historial-estados.css';
import '../registro-operatividad/registro-operatividad.css';

const REGISTROS_POR_PAGINA = 10;

export function HistorialEstadosPage() {
  const { user } = useAuth();

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [registros, setRegistros] = useState<RegistroOperatividad[]>([]);
  const [idVehiculo, setIdVehiculo] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modo: 'historial' o 'registrar'
  const [modo, setModo] = useState<'historial' | 'registrar'>('historial');

  // Estado del formulario de registro
  const [idVehiculoRegistro, setIdVehiculoRegistro] = useState<number | null>(null);
  const [nivelCombustible, setNivelCombustible] = useState(100);
  const [nivelAgua, setNivelAgua] = useState(100);
  const [nivelAceite, setNivelAceite] = useState(100);
  const [observaciones, setObservaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      const [listaVehiculos, listaRegistros] = await Promise.all([
        listarVehiculos(),
        listarRegistros(),
      ]);
      setVehiculos(listaVehiculos);
      setRegistros(listaRegistros);
      if (!idVehiculo && listaVehiculos.length > 0) {
        setIdVehiculo(listaVehiculos[0].id_vehiculo);
      }
      if (!idVehiculoRegistro && listaVehiculos.length > 0) {
        setIdVehiculoRegistro(listaVehiculos[0].id_vehiculo);
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const registrosDelVehiculo = useMemo(() => {
    return registros
      .filter((r) => r.id_vehiculo === idVehiculo)
      .sort(
        (a, b) =>
          new Date(b.fecha_hora_registro).getTime() -
          new Date(a.fecha_hora_registro).getTime(),
      );
  }, [registros, idVehiculo]);

  const vehiculoSeleccionado = useMemo(() => {
    return vehiculos.find((v) => v.id_vehiculo === idVehiculo);
  }, [vehiculos, idVehiculo]);

  const ultimoRegistro = registrosDelVehiculo[0];

  const totalPaginas = Math.max(
    1,
    Math.ceil(registrosDelVehiculo.length / REGISTROS_POR_PAGINA),
  );
  const registrosPagina = registrosDelVehiculo.slice(
    (pagina - 1) * REGISTROS_POR_PAGINA,
    pagina * REGISTROS_POR_PAGINA,
  );

  function handleCambiarVehiculo(id: number) {
    setIdVehiculo(id);
    setPagina(1);
  }

  const handleGuardarRegistro = async (event: FormEvent) => {
    event.preventDefault();
    if (!idVehiculoRegistro || !user) return;

    setIsSaving(true);
    setErrorRegistro(null);

    try {
      await crearRegistroOperatividad({
        fecha_hora_registro: new Date().toISOString(),
        nivel_combustible: nivelCombustible,
        nivel_agua: nivelAgua,
        nivel_aceite: nivelAceite,
        observaciones: observaciones.trim() || undefined,
        id_usuario: user.id,
        id_vehiculo: idVehiculoRegistro,
      });

      setMensajeExito(`Registro guardado exitosamente para el vehículo seleccionado.`);
      setObservaciones('');
      await cargarDatos();
      setIdVehiculo(idVehiculoRegistro);
      setModo('historial');
    } catch (err) {
      setErrorRegistro(err instanceof Error ? err.message : 'No se pudo guardar el registro.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p style={{ color: 'var(--color-ink-600)', fontFamily: 'var(--font-body)' }}>Cargando datos…</p>;
  }

  return (
    <div className="historial-page" style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="historial-page__title">Historial de Estados y Operatividad</h1>
          <p className="historial-page__subtitle" style={{ margin: 0 }}>
            Revisa el histórico de revisiones diarias o registra una nueva inspección de operatividad.
          </p>
        </div>

        {modo === 'historial' ? (
          <button
            onClick={() => {
              setMensajeExito(null);
              setErrorRegistro(null);
              setModo('registrar');
            }}
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--color-white)',
              backgroundColor: 'var(--color-navy-900)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 18px',
              cursor: 'pointer',
            }}
          >
            + Registrar Nuevo Estado
          </button>
        ) : (
          <button
            onClick={() => setModo('historial')}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--color-navy-900)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            ← Volver al Historial
          </button>
        )}
      </div>

      {mensajeExito && (
        <p className="registro-page__success" role="status" style={{ marginBottom: 'var(--space-4)' }}>
          ✓ {mensajeExito}
        </p>
      )}

      {/* MODO REGISTRAR ESTADO */}
      {modo === 'registrar' ? (
        <div style={{ maxWidth: 540, background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-6)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy-900)', margin: '0 0 var(--space-4)', fontSize: '1.25rem' }}>
            Nueva Inspección de Operatividad
          </h2>

          {errorRegistro && (
            <p className="registro-page__alert" role="alert">
              {errorRegistro}
            </p>
          )}

          <form onSubmit={handleGuardarRegistro}>
            <div className="registro-form__field">
              <label htmlFor="vehiculo-reg">Vehículo a inspeccionar</label>
              <select
                id="vehiculo-reg"
                value={idVehiculoRegistro ?? ''}
                onChange={(e) => setIdVehiculoRegistro(Number(e.target.value))}
                required
              >
                {vehiculos.map((v) => (
                  <option key={v.id_vehiculo} value={v.id_vehiculo}>
                    {v.patente} — {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            <div className="registro-form__slider">
              <label htmlFor="combustible-slider">
                <span>Nivel de Combustible</span>
                <NivelBadge valor={nivelCombustible} mostrarEtiqueta />
              </label>
              <input
                id="combustible-slider"
                type="range"
                min={0}
                max={100}
                value={nivelCombustible}
                onChange={(e) => setNivelCombustible(Number(e.target.value))}
              />
            </div>

            <div className="registro-form__slider">
              <label htmlFor="agua-slider">
                <span>Nivel de Agua</span>
                <NivelBadge valor={nivelAgua} mostrarEtiqueta />
              </label>
              <input
                id="agua-slider"
                type="range"
                min={0}
                max={100}
                value={nivelAgua}
                onChange={(e) => setNivelAgua(Number(e.target.value))}
              />
            </div>

            <div className="registro-form__slider">
              <label htmlFor="aceite-slider">
                <span>Nivel de Aceite</span>
                <NivelBadge valor={nivelAceite} mostrarEtiqueta />
              </label>
              <input
                id="aceite-slider"
                type="range"
                min={0}
                max={100}
                value={nivelAceite}
                onChange={(e) => setNivelAceite(Number(e.target.value))}
              />
            </div>

            <div className="registro-form__field">
              <label htmlFor="observaciones-reg">Observaciones de la inspección</label>
              <textarea
                id="observaciones-reg"
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: neumáticos en buen estado, nivel de aceite revisado en frío..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <button
                type="button"
                onClick={() => setModo('historial')}
                style={{
                  fontFamily: 'var(--font-body)',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 16px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || !idVehiculoRegistro}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  color: 'var(--color-white)',
                  backgroundColor: 'var(--color-navy-900)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 18px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                {isSaving ? 'Guardando…' : 'Guardar Inspección'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* MODO HISTORIAL */
        <>
          <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
            <div className="historial-page__field" style={{ margin: 0, minWidth: 280 }}>
              <label htmlFor="vehiculo">Filtrar por Vehículo</label>
              <select
                id="vehiculo"
                value={idVehiculo ?? ''}
                onChange={(e) => handleCambiarVehiculo(Number(e.target.value))}
              >
                {vehiculos.map((v) => (
                  <option key={v.id_vehiculo} value={v.id_vehiculo}>
                    {v.patente} — {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            {/* Resumen del último estado */}
            {ultimoRegistro && vehiculoSeleccionado && (
              <div
                style={{
                  background: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 20px',
                  display: 'flex',
                  gap: '24px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                    Último Reporte
                  </span>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--color-ink-900)' }}>
                    {new Date(ultimoRegistro.fecha_hora_registro).toLocaleString('es-CL')}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                    Combustible
                  </span>
                  <NivelBadge valor={ultimoRegistro.nivel_combustible} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                    Agua
                  </span>
                  <NivelBadge valor={ultimoRegistro.nivel_agua} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                    Aceite
                  </span>
                  <NivelBadge valor={ultimoRegistro.nivel_aceite} />
                </div>
              </div>
            )}
          </div>

          {registrosDelVehiculo.length === 0 ? (
            <p className="historial-table__empty">
              Este vehículo todavía no tiene registros de operatividad reportados.
            </p>
          ) : (
            <>
              <div className="table-responsive">
                <table className="historial-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Combustible</th>
                    <th>Agua</th>
                    <th>Aceite</th>
                    <th>Observaciones</th>
                    <th>Reportado por</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosPagina.map((r) => (
                    <tr key={r.id_registro}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(r.fecha_hora_registro).toLocaleString('es-CL')}
                      </td>
                      <td>
                        <NivelBadge valor={r.nivel_combustible} />
                      </td>
                      <td>
                        <NivelBadge valor={r.nivel_agua} />
                      </td>
                      <td>
                        <NivelBadge valor={r.nivel_aceite} />
                      </td>
                      <td>{r.observaciones || <span style={{ color: 'var(--color-ink-400)' }}>—</span>}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {r.usuario ? `${r.usuario.nombre} ${r.usuario.apellidos}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="historial-page__paginacion">
                <button
                  disabled={pagina === 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  ← Anterior
                </button>
                <span>
                  Página {pagina} de {totalPaginas} ({registrosDelVehiculo.length} registros)
                </span>
                <button
                  disabled={pagina === totalPaginas}
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                >
                  Siguiente →
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
