import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarVehiculos,
  listarCompanias,
  type Vehiculo,
  type CompaniaOption,
} from '../../services/vehiculos';
import {
  listarRegistros,
  crearRegistroOperatividad,
  actualizarRegistroOperatividad,
  type RegistroOperatividad,
} from '../../services/registroOperatividad';
import { NivelBadge } from '../../components/NivelBadge';
import { Modal } from '../../components/Modal';
import './historial-estados.css';
import '../registro-operatividad/registro-operatividad.css';

const REGISTROS_POR_PAGINA = 10;

export function HistorialEstadosPage() {
  const { user, hasPermission, getScope } = useAuth();
  const userRol = (user?.rol || '').toLowerCase().trim();
  const esAdmin = userRol === 'administrador';
  const scope = getScope('operatividad');
  const esAlcanceCompania = scope === 'COMPANY' && Boolean(user?.id_compania);
  const puedeVerTodasCompanias = scope === 'GLOBAL' || esAdmin;
  const puedeRegistrarEstado = hasPermission('operatividad', 'create') || esAdmin;
  const puedeEditarEstado = hasPermission('operatividad', 'update') || esAdmin;

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
  const [registros, setRegistros] = useState<RegistroOperatividad[]>([]);
  const [idCompania, setIdCompania] = useState<string>(() => {
    return esAlcanceCompania && user?.id_compania ? String(user.id_compania) : '';
  });
  const [idVehiculo, setIdVehiculo] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modo: 'historial' o 'registrar'
  const [modo, setModo] = useState<'historial' | 'registrar'>('historial');

  // Estado del formulario de registro
  const [idCompaniaRegistro, setIdCompaniaRegistro] = useState<string>(() => {
    return esAlcanceCompania && user?.id_compania ? String(user.id_compania) : '';
  });
  const [idVehiculoRegistro, setIdVehiculoRegistro] = useState<number | null>(null);
  const [nivelCombustible, setNivelCombustible] = useState(100);
  const [nivelAgua, setNivelAgua] = useState(100);
  const [nivelAceite, setNivelAceite] = useState(100);
  const [observaciones, setObservaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal de Modificación de Registro de Operatividad
  const [registroEditando, setRegistroEditando] = useState<RegistroOperatividad | null>(null);
  const [editCombustible, setEditCombustible] = useState(100);
  const [editAgua, setEditAgua] = useState(100);
  const [editAceite, setEditAceite] = useState(100);
  const [editObservaciones, setEditObservaciones] = useState('');
  const [isSavingEdicion, setIsSavingEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  const vehiculosVisibles = useMemo(() => {
    if (esAlcanceCompania && user?.id_compania) {
      return vehiculos.filter((v) => v.id_compania === user.id_compania);
    }
    if (idCompania) {
      return vehiculos.filter((v) => String(v.id_compania) === idCompania);
    }
    return vehiculos;
  }, [vehiculos, esAlcanceCompania, user?.id_compania, idCompania]);

  const vehiculosRegistroVisibles = useMemo(() => {
    const ciaObjetivo =
      esAlcanceCompania && user?.id_compania ? String(user.id_compania) : idCompaniaRegistro;
    if (!ciaObjetivo) return vehiculos;
    return vehiculos.filter((v) => String(v.id_compania) === ciaObjetivo);
  }, [vehiculos, esAlcanceCompania, user?.id_compania, idCompaniaRegistro]);

  const cargarDatos = async () => {
    try {
      const [listaVehiculos, listaRegistros, listaCompanias] = await Promise.all([
        listarVehiculos(),
        listarRegistros(),
        listarCompanias().catch(() => []),
      ]);
      setVehiculos(listaVehiculos);
      setRegistros(listaRegistros);
      setCompanias(
        [...listaCompanias].sort(
          (a, b) => (a.numero_compania ?? a.id_compania) - (b.numero_compania ?? b.id_compania),
        ),
      );
      const filtrados =
        esAlcanceCompania && user?.id_compania
          ? listaVehiculos.filter((v) => v.id_compania === user.id_compania)
          : listaVehiculos;
      if (!idVehiculo && filtrados.length > 0) {
        setIdVehiculo(filtrados[0].id_vehiculo);
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

  useEffect(() => {
    if (vehiculosVisibles.length === 0) {
      setIdVehiculo(null);
      return;
    }
    const sigueVisible = vehiculosVisibles.some((v) => v.id_vehiculo === idVehiculo);
    if (!sigueVisible) {
      setIdVehiculo(vehiculosVisibles[0].id_vehiculo);
      setPagina(1);
    }
  }, [vehiculosVisibles, idVehiculo]);

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

  function formatearEtiquetaVehiculo(v: Vehiculo) {
    const prefijo = v.nomenclatura ? `${v.nomenclatura} (${v.patente})` : v.patente;
    return `${prefijo} — ${v.marca} ${v.modelo}`;
  }

  const handleAbrirFormularioRegistro = () => {
    setMensajeExito(null);
    setErrorRegistro(null);
    if (esAlcanceCompania && user?.id_compania) {
      setIdCompaniaRegistro(String(user.id_compania));
      setIdVehiculoRegistro(idVehiculo);
    } else {
      const ciaInicial =
        idCompania ||
        (vehiculoSeleccionado?.id_compania
          ? String(vehiculoSeleccionado.id_compania)
          : companias[0]
          ? String(companias[0].id_compania)
          : '');
      setIdCompaniaRegistro(ciaInicial);
      setIdVehiculoRegistro(idVehiculo);
    }
    setModo('registrar');
  };

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

      setMensajeExito('Inspección de operatividad guardada exitosamente.');
      setObservaciones('');
      await cargarDatos();
      if (!esAlcanceCompania && idCompaniaRegistro) {
        setIdCompania(idCompaniaRegistro);
      }
      setIdVehiculo(idVehiculoRegistro);
      setPagina(1);
      setModo('historial');
    } catch (err) {
      setErrorRegistro(err instanceof Error ? err.message : 'No se pudo guardar el registro.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAbrirModalEditar = (reg: RegistroOperatividad) => {
    setErrorEdicion(null);
    setRegistroEditando(reg);
    setEditCombustible(reg.nivel_combustible !== null ? Number(reg.nivel_combustible) : 100);
    setEditAgua(reg.nivel_agua !== null ? Number(reg.nivel_agua) : 100);
    setEditAceite(reg.nivel_aceite !== null ? Number(reg.nivel_aceite) : 100);
    setEditObservaciones(reg.observaciones || '');
  };

  const handleGuardarEdicion = async (event: FormEvent) => {
    event.preventDefault();
    if (!puedeEditarEstado || !registroEditando) return;

    setIsSavingEdicion(true);
    setErrorEdicion(null);

    try {
      await actualizarRegistroOperatividad(registroEditando.id_registro, {
        nivel_combustible: editCombustible,
        nivel_agua: editAgua,
        nivel_aceite: editAceite,
        observaciones: editObservaciones.trim() || undefined,
      });

      setRegistroEditando(null);
      setMensajeExito(`Registro #${registroEditando.id_registro} actualizado correctamente.`);
      await cargarDatos();
    } catch (err) {
      setErrorEdicion(
        err instanceof Error ? err.message : 'No se pudo modificar el registro de operatividad.',
      );
    } finally {
      setIsSavingEdicion(false);
    }
  };

  if (isLoading) {
    return (
      <p style={{ color: 'var(--color-ink-600)', fontFamily: 'var(--font-body)' }}>
        Cargando historial de estados…
      </p>
    );
  }

  return (
    <div className="historial-page">
      {/* CABECERA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1 className="historial-page__title" style={{ margin: 0 }}>
            {esAlcanceCompania && user?.compania
              ? `Operatividad y Niveles — ${user.compania}`
              : 'Historial de Estados y Operatividad'}
          </h1>
          <p
            style={{
              margin: 'var(--space-1) 0 0',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--color-ink-500)',
            }}
          >
            Control de revisiones diarias de combustible, agua y aceite de los carros de emergencia.
          </p>
        </div>

        {modo === 'historial' ? (
          puedeRegistrarEstado && (
            <button
              type="button"
              onClick={handleAbrirFormularioRegistro}
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
          )
        ) : (
          <button
            type="button"
            onClick={() => setModo('historial')}
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'var(--color-navy-900)',
              background: 'var(--color-white)',
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
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            background: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-6)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            boxSizing: 'border-box',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-navy-900)',
              margin: '0 0 var(--space-4)',
              fontSize: '1.25rem',
            }}
          >
            Nueva Inspección de Operatividad
          </h2>

          {errorRegistro && (
            <p className="registro-page__alert" role="alert">
              {errorRegistro}
            </p>
          )}

          <form
            onSubmit={handleGuardarRegistro}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <div className="registro-form__field" style={{ marginBottom: 0 }}>
              <label
                htmlFor="personal-cargo-reg"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-navy-900)',
                }}
              >
                Personal a cargo de la inspección <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="personal-cargo-reg"
                type="text"
                readOnly
                value={
                  user?.email
                    ? `${user.nombre} ${user.apellidos} (${user.email})`
                    : user?.nombre
                    ? `${user.nombre} ${user.apellidos ?? ''}`.trim()
                    : 'Usuario autenticado'
                }
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#f8fafc',
                  color: 'var(--color-ink-700)',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <div className="registro-form__field" style={{ marginBottom: 0 }}>
              <label
                htmlFor="compania-reg"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-navy-900)',
                }}
              >
                Compañía <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="compania-reg"
                disabled={esAlcanceCompania}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: esAlcanceCompania ? '#f8fafc' : 'var(--color-white)',
                  color: 'var(--color-ink-900)',
                  cursor: esAlcanceCompania ? 'not-allowed' : 'pointer',
                }}
                value={
                  esAlcanceCompania && user?.id_compania
                    ? String(user.id_compania)
                    : idCompaniaRegistro
                }
                onChange={(e) => {
                  setIdCompaniaRegistro(e.target.value);
                  setIdVehiculoRegistro(null);
                }}
                required
              >
                <option value="" disabled>
                  Selecciona la compañía…
                </option>
                {companias.map((c) => (
                  <option key={c.id_compania} value={c.id_compania}>
                    {c.numero_compania
                      ? `${c.numero_compania}ª Cía. — ${c.nombre.replace(/^.*Compañía\s*/i, '')}`
                      : c.nombre}
                  </option>
                ))}
              </select>
              {esAlcanceCompania && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)', display: 'block', marginTop: '4px' }}>
                  Fijada automáticamente según tu compañía asignada.
                </span>
              )}
            </div>

            <div className="registro-form__field" style={{ marginBottom: 0 }}>
              <label
                htmlFor="vehiculo-reg"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-900)',
                }}
              >
                Vehículo a inspeccionar
              </label>
              <select
                id="vehiculo-reg"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-white)',
                }}
                value={idVehiculoRegistro ?? ''}
                onChange={(e) =>
                  setIdVehiculoRegistro(e.target.value === '' ? null : Number(e.target.value))
                }
                disabled={vehiculosRegistroVisibles.length === 0}
                required
              >
                <option value="" disabled>
                  {vehiculosRegistroVisibles.length === 0
                    ? 'No hay vehículos registrados en esta compañía'
                    : 'Selecciona vehículo a inspeccionar…'}
                </option>
                {vehiculosRegistroVisibles.map((v) => (
                  <option key={v.id_vehiculo} value={v.id_vehiculo}>
                    {formatearEtiquetaVehiculo(v)}
                  </option>
                ))}
              </select>
            </div>

            <div className="registro-form__slider" style={{ marginBottom: 0 }}>
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

            <div className="registro-form__slider" style={{ marginBottom: 0 }}>
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

            <div className="registro-form__slider" style={{ marginBottom: 0 }}>
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

            <div className="registro-form__field" style={{ marginBottom: 0 }}>
              <label
                htmlFor="observaciones-reg"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-900)',
                }}
              >
                Observaciones de la inspección
              </label>
              <textarea
                id="observaciones-reg"
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: neumáticos en buen estado, nivel de aceite revisado en frío..."
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: 'var(--space-2)',
              }}
            >
              <button
                type="button"
                onClick={() => setModo('historial')}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
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
                  fontSize: '0.9375rem',
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
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-4)',
            }}
          >
            {puedeVerTodasCompanias && (
              <select
                aria-label="Filtrar por compañía"
                value={idCompania}
                onChange={(e) => setIdCompania(e.target.value)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-white)',
                  color: 'var(--color-ink-900)',
                  maxWidth: '220px',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                <option value="">Todas las compañías</option>
                {companias.map((c) => (
                  <option key={c.id_compania} value={c.id_compania} title={c.nombre}>
                    {c.numero_compania
                      ? `${c.numero_compania}ª Cía. — ${c.nombre.replace(/^.*Compañía\s*/i, '')}`
                      : c.nombre}
                  </option>
                ))}
              </select>
            )}

            <select
              aria-label="Seleccionar vehículo"
              value={idVehiculo ?? ''}
              onChange={(e) => handleCambiarVehiculo(Number(e.target.value))}
              disabled={vehiculosVisibles.length === 0}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-white)',
                color: 'var(--color-ink-900)',
                minWidth: '280px',
                maxWidth: '380px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {vehiculosVisibles.length === 0 ? (
                <option value="">Sin vehículos en esta compañía</option>
              ) : (
                vehiculosVisibles.map((v) => (
                  <option key={v.id_vehiculo} value={v.id_vehiculo}>
                    {formatearEtiquetaVehiculo(v)}
                  </option>
                ))
              )}
            </select>

            {esAlcanceCompania && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  backgroundColor: '#eff6ff',
                  color: '#1d4ed8',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: '1px solid #bfdbfe',
                }}
              >
                🏢 {user?.compania || 'Mi Compañía'}
              </span>
            )}
          </div>

          {ultimoRegistro && vehiculoSeleccionado && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-5)',
              }}
            >
              <div
                style={{
                  background: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 18px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-ink-600)',
                    textTransform: 'uppercase',
                    display: 'block',
                  }}
                >
                  Último Reporte
                </span>
                <strong
                  style={{
                    fontSize: '0.9375rem',
                    color: 'var(--color-navy-900)',
                    display: 'block',
                    marginTop: '6px',
                  }}
                >
                  {new Date(ultimoRegistro.fecha_hora_registro).toLocaleString('es-CL')}
                </strong>
              </div>

              <div
                style={{
                  background: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 18px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-ink-600)',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Combustible
                </span>
                <NivelBadge valor={ultimoRegistro.nivel_combustible} mostrarEtiqueta />
              </div>

              <div
                style={{
                  background: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 18px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-ink-600)',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Agua
                </span>
                <NivelBadge valor={ultimoRegistro.nivel_agua} mostrarEtiqueta />
              </div>

              <div
                style={{
                  background: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 18px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-ink-600)',
                    textTransform: 'uppercase',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Aceite
                </span>
                <NivelBadge valor={ultimoRegistro.nivel_aceite} mostrarEtiqueta />
              </div>
            </div>
          )}

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
                      {puedeEditarEstado && <th>Acciones</th>}
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
                        <td>
                          {r.observaciones || (
                            <span style={{ color: 'var(--color-ink-400)' }}>—</span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {r.usuario ? `👤 ${r.usuario.nombre} ${r.usuario.apellidos}` : '—'}
                        </td>
                        {puedeEditarEstado && (
                          <td>
                            <button
                              type="button"
                              onClick={() => handleAbrirModalEditar(r)}
                              style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: '#0369a1',
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                borderRadius: 'var(--radius-sm)',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ✏️ Modificar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="historial-page__paginacion">
                <button
                  type="button"
                  disabled={pagina === 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                >
                  ← Anterior
                </button>
                <span>
                  Página {pagina} de {totalPaginas}
                </span>
                <button
                  type="button"
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

      {/* MODAL PARA MODIFICAR REGISTRO DE OPERATIVIDAD */}
      {registroEditando && (
        <Modal
          onClose={() => setRegistroEditando(null)}
          title={`Modificar Inspección #${registroEditando.id_registro}`}
        >
          {errorEdicion && (
            <p className="registro-page__alert" role="alert" style={{ marginBottom: '16px' }}>
              {errorEdicion}
            </p>
          )}

          <form
            onSubmit={handleGuardarEdicion}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <div
              style={{
                padding: '8px 12px',
                background: '#f8fafc',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                color: 'var(--color-ink-700)',
              }}
            >
              📅 Fecha original:{' '}
              <strong>{new Date(registroEditando.fecha_hora_registro).toLocaleString('es-CL')}</strong>
            </div>

            <div className="registro-form__slider" style={{ marginBottom: 0 }}>
              <label htmlFor="edit-combustible-slider">
                <span>Nivel de Combustible</span>
                <NivelBadge valor={editCombustible} mostrarEtiqueta />
              </label>
              <input
                id="edit-combustible-slider"
                type="range"
                min={0}
                max={100}
                value={editCombustible}
                onChange={(e) => setEditCombustible(Number(e.target.value))}
              />
            </div>

            <div className="registro-form__slider" style={{ marginBottom: 0 }}>
              <label htmlFor="edit-agua-slider">
                <span>Nivel de Agua</span>
                <NivelBadge valor={editAgua} mostrarEtiqueta />
              </label>
              <input
                id="edit-agua-slider"
                type="range"
                min={0}
                max={100}
                value={editAgua}
                onChange={(e) => setEditAgua(Number(e.target.value))}
              />
            </div>

            <div className="registro-form__slider" style={{ marginBottom: 0 }}>
              <label htmlFor="edit-aceite-slider">
                <span>Nivel de Aceite</span>
                <NivelBadge valor={editAceite} mostrarEtiqueta />
              </label>
              <input
                id="edit-aceite-slider"
                type="range"
                min={0}
                max={100}
                value={editAceite}
                onChange={(e) => setEditAceite(Number(e.target.value))}
              />
            </div>

            <div className="registro-form__field" style={{ marginBottom: 0 }}>
              <label
                htmlFor="edit-observaciones-reg"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-900)',
                }}
              >
                Observaciones de la inspección
              </label>
              <textarea
                id="edit-observaciones-reg"
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  padding: '10px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
                value={editObservaciones}
                onChange={(e) => setEditObservaciones(e.target.value)}
                placeholder="Observaciones adicionales..."
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                marginTop: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => setRegistroEditando(null)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingEdicion}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'var(--color-white)',
                  backgroundColor: 'var(--color-navy-900)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 18px',
                  cursor: isSavingEdicion ? 'not-allowed' : 'pointer',
                }}
              >
                {isSavingEdicion ? 'Guardando…' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}