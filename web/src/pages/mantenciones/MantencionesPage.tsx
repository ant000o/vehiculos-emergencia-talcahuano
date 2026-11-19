import { useEffect, useState, useMemo, type FormEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarMantenciones,
  crearMantencion,
  actualizarMantencion,
  actualizarEstadoMantencion,
  type Mantencion,
  type TipoMantencion,
  type EstadoMantencion,
} from '../../services/mantenciones';
import {
  listarVehiculos,
  listarCompanias,
  type Vehiculo,
  type CompaniaOption,
} from '../../services/vehiculos';
import { listarArticulos, descontarRepuesto, type ArticuloInventario } from '../../services/inventario';
import { Modal } from '../../components/Modal';
import './mantenciones.css';

export function MantencionesPage() {
  const { user, hasPermission, getScope } = useAuth();
  const userRol = (user?.rol || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const esAdmin = userRol === 'administrador';
  const esCapitan = userRol === 'capitan';
  const scope = getScope('mantenciones');
  const esAlcanceCompania = scope === 'COMPANY' && Boolean(user?.id_compania);
  const puedeVerTodasCompanias = scope === 'GLOBAL' || esAdmin;
  const puedeCrearMantencion = hasPermission('mantenciones', 'create') || esAdmin;
  const puedeEditarMantencion = hasPermission('mantenciones', 'update') || esAdmin;
  const puedeFinalizarMantencion = esCapitan;

  const [mantenciones, setMantenciones] = useState<Mantencion[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
  const [articulos, setArticulos] = useState<ArticuloInventario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros en el listado
  const [filtroTipo, setFiltroTipo] = useState<TipoMantencion | ''>('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoMantencion | ''>('');
  const [idCompania, setIdCompania] = useState<string>(() => {
    return esAlcanceCompania && user?.id_compania ? String(user.id_compania) : '';
  });

  // Modo: 'lista' | 'crear'
  const [modo, setModo] = useState<'lista' | 'crear'>('lista');

  // Mantención seleccionada para ver detalles y repuestos
  const [mantencionDetalle, setMantencionDetalle] = useState<Mantencion | null>(null);

  // Modal de Edición de Mantención
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [editTipo, setEditTipo] = useState<TipoMantencion>('preventiva');
  const [editEstado, setEditEstado] = useState<EstadoMantencion>('en_proceso');
  const [editKilometraje, setEditKilometraje] = useState<number | ''>('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editCostoMO, setEditCostoMO] = useState<number>(0);
  const [editTallerExterno, setEditTallerExterno] = useState('');
  const [isSavingEdicion, setIsSavingEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  // Modal para agregar repuesto dentro de la mantención seleccionada
  const [modalRepuestoAbierto, setModalRepuestoAbierto] = useState(false);
  const [idArticuloSeleccionado, setIdArticuloSeleccionado] = useState<number | ''>('');
  const [cantidadRepuesto, setCantidadRepuesto] = useState(1);
  const [errorRepuesto, setErrorRepuesto] = useState<string | null>(null);
  const [isSavingRepuesto, setIsSavingRepuesto] = useState(false);

  // Formulario de Nueva Mantención
  const [formTipo, setFormTipo] = useState<TipoMantencion>('preventiva');
  const [formIdCompania, setFormIdCompania] = useState<string>(() => {
    return esAlcanceCompania && user?.id_compania ? String(user.id_compania) : '';
  });
  const [formIdVehiculo, setFormIdVehiculo] = useState<number | ''>('');
  const [formKilometraje, setFormKilometraje] = useState<number | ''>('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCostoMO, setFormCostoMO] = useState<number>(0);
  const [formTallerExterno, setFormTallerExterno] = useState('');
  const [isSavingMantencion, setIsSavingMantencion] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      const [mants, vehs, arts, comps] = await Promise.all([
        listarMantenciones(),
        listarVehiculos(),
        listarArticulos(),
        listarCompanias(),
      ]);
      setMantenciones(mants);
      setVehiculos(vehs);
      setArticulos(arts.sort((a, b) => a.id_articulo - b.id_articulo));
      setCompanias(
        [...comps].sort(
          (a, b) => (a.numero_compania ?? a.id_compania) - (b.numero_compania ?? b.id_compania),
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarVehiculo = (id: number) => {
    setFormIdVehiculo(id);
    const v = vehiculos.find((veh) => veh.id_vehiculo === id);
    if (v && v.kilometraje !== undefined && v.kilometraje !== null) {
      setFormKilometraje(Number(v.kilometraje));
    } else {
      setFormKilometraje('');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (mantencionDetalle) {
      const actual = mantenciones.find((m) => m.id_mantencion === mantencionDetalle.id_mantencion);
      if (actual) setMantencionDetalle(actual);
    }
  }, [mantenciones]);

  const mantencionesFiltradas = useMemo(() => {
    return mantenciones.filter((m) => {
      if (filtroTipo && m.tipo_mantencion !== filtroTipo) return false;
      if (filtroEstado && m.estado_mantencion !== filtroEstado) return false;

      const companiaVehiculo =
        m.vehiculo?.id_compania ??
        vehiculos.find((v) => v.id_vehiculo === m.id_vehiculo)?.id_compania;

      if (esAlcanceCompania && user?.id_compania) {
        if (companiaVehiculo && companiaVehiculo !== user.id_compania) {
          return false;
        }
      } else if (idCompania) {
        if (String(companiaVehiculo) !== idCompania) {
          return false;
        }
      }

      return true;
    });
  }, [mantenciones, vehiculos, filtroTipo, filtroEstado, esAlcanceCompania, user?.id_compania, idCompania]);

  const vehiculosParaMantencion = useMemo(() => {
    const ciaObjetivo =
      esAlcanceCompania && user?.id_compania ? String(user.id_compania) : formIdCompania;
    if (!ciaObjetivo) return vehiculos;
    return vehiculos.filter((v) => String(v.id_compania) === ciaObjetivo);
  }, [vehiculos, esAlcanceCompania, user?.id_compania, formIdCompania]);

  const articulosDisponiblesModal = useMemo(() => {
    if (!mantencionDetalle) return articulos;
    const ciaVehiculo =
      mantencionDetalle.vehiculo?.id_compania ??
      vehiculos.find((v) => v.id_vehiculo === mantencionDetalle.id_vehiculo)?.id_compania;
    if (!ciaVehiculo) return articulos;
    const deCompania = articulos.filter((a) => a.id_compania === ciaVehiculo);
    return deCompania.length > 0 ? deCompania : articulos;
  }, [mantencionDetalle, vehiculos, articulos]);

  const handleAbrirFormularioCrear = () => {
    setErrorForm(null);
    setFormIdVehiculo('');
    setFormKilometraje('');
    if (esAlcanceCompania && user?.id_compania) {
      setFormIdCompania(String(user.id_compania));
    } else {
      setFormIdCompania(idCompania || (companias[0] ? String(companias[0].id_compania) : ''));
    }
    setModo('crear');
  };

  // Abrir Modal de Modificación de Mantención
  const handleAbrirModalEditar = (m: Mantencion) => {
    setErrorEdicion(null);
    setEditTipo(m.tipo_mantencion);
    setEditEstado(m.estado_mantencion);
    setEditKilometraje(m.kilometraje !== undefined && m.kilometraje !== null ? Number(m.kilometraje) : '');
    setEditDescripcion(m.descripcion_falla || '');
    setEditCostoMO(Number(m.costo_mano_obra) || 0);
    setEditTallerExterno(m.taller_externo || '');
    setModalEditarAbierto(true);
  };

  const handleGuardarEdicion = async (e: FormEvent) => {
    e.preventDefault();
    if (!mantencionDetalle) return;

    if (editEstado === 'finalizada' && !puedeFinalizarMantencion) {
      setErrorEdicion('Solo el Capitán puede marcar una mantención como finalizada.');
      return;
    }

    setIsSavingEdicion(true);
    setErrorEdicion(null);

    try {
      await actualizarMantencion(mantencionDetalle.id_mantencion, {
        tipo_mantencion: editTipo,
        estado_mantencion: editEstado,
        kilometraje: editKilometraje !== '' ? Number(editKilometraje) : undefined,
        descripcion_falla: editDescripcion.trim() || undefined,
        costo_mano_obra: Number(editCostoMO),
        taller_externo: editTallerExterno.trim() || undefined,
        ...(editEstado === 'finalizada' && !mantencionDetalle.fecha_salida
          ? { fecha_salida: new Date().toISOString() }
          : {}),
      });

      setModalEditarAbierto(false);
      await cargarDatos();
    } catch (err) {
      setErrorEdicion(err instanceof Error ? err.message : 'Error al modificar la orden de mantención.');
    } finally {
      setIsSavingEdicion(false);
    }
  };

  // Guardar Nueva Mantención
  const handleCrearMantencion = async (e: FormEvent) => {
    e.preventDefault();
    if (!formIdVehiculo || !user) return;

    setIsSavingMantencion(true);
    setErrorForm(null);

    try {
      const nueva = await crearMantencion({
        tipo_mantencion: formTipo,
        id_vehiculo: Number(formIdVehiculo),
        kilometraje: formKilometraje !== '' ? Number(formKilometraje) : undefined,
        descripcion_falla: formDescripcion.trim() || undefined,
        costo_mano_obra: Number(formCostoMO),
        estado_mantencion: 'en_proceso',
        id_usuario_mecanico: user.id,
        taller_externo: formTallerExterno.trim() || undefined,
      });

      await cargarDatos();
      setModo('lista');
      setFormDescripcion('');
      setFormCostoMO(0);
      setFormTallerExterno('');
      setFormKilometraje('');
      setFormIdVehiculo('');
      setMantencionDetalle(nueva);
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'Error al registrar la mantención.');
    } finally {
      setIsSavingMantencion(false);
    }
  };

  // Agregar repuesto usado a la mantención abierta
  const handleAgregarRepuesto = async (e: FormEvent) => {
    e.preventDefault();
    if (!mantencionDetalle || !idArticuloSeleccionado || cantidadRepuesto < 1) return;

    const art = articulos.find((a) => a.id_articulo === Number(idArticuloSeleccionado));
    if (!art) return;

    if (cantidadRepuesto > art.stock_actual) {
      setErrorRepuesto(`Stock insuficiente: solo quedan ${art.stock_actual} unidades en inventario.`);
      return;
    }

    setIsSavingRepuesto(true);
    setErrorRepuesto(null);

    try {
      await descontarRepuesto({
        cantidad: cantidadRepuesto,
        id_mantencion: mantencionDetalle.id_mantencion,
        id_articulo: art.id_articulo,
        costo_unitario_historico: Number(art.costo_unitario_actual),
      });

      setModalRepuestoAbierto(false);
      setIdArticuloSeleccionado('');
      setCantidadRepuesto(1);
      await cargarDatos();
    } catch (err) {
      setErrorRepuesto(err instanceof Error ? err.message : 'Error al imputar el repuesto.');
    } finally {
      setIsSavingRepuesto(false);
    }
  };

  // Finalizar mantención (exclusivo Capitán)
  const handleFinalizarMantencion = async (m: Mantencion) => {
    if (!puedeFinalizarMantencion) return;

    if (
      !confirm(
        `¿Estás seguro de finalizar la mantención #${m.id_mantencion}? El vehículo ${
          m.vehiculo?.patente ?? ''
        } volverá automáticamente a estado OPERATIVO.`,
      )
    ) {
      return;
    }

    try {
      await actualizarEstadoMantencion(m.id_mantencion, 'finalizada', new Date().toISOString());
      await cargarDatos();
      alert('Mantención finalizada con éxito. Vehículo disponible y operativo.');
    } catch (err) {
      alert('Error al finalizar la mantención.');
    }
  };

  const badgeTipo = (tipo: TipoMantencion) => {
    switch (tipo) {
      case 'preventiva':
        return { bg: '#dcfce7', text: '#15803d', label: '🟢 Preventiva' };
      case 'correctiva':
        return { bg: '#fef9c3', text: '#a16207', label: '🟡 Correctiva' };
      case 'revision':
        return { bg: '#eff6ff', text: '#1d4ed8', label: '🔵 Revisión' };
      case 'emergencia':
        return { bg: '#fee2e2', text: '#b91c1c', label: '🔴 Emergencia' };
    }
  };

  const badgeEstado = (estado: EstadoMantencion) => {
    switch (estado) {
      case 'finalizada':
        return { bg: '#dcfce7', text: '#15803d', label: 'Finalizada' };
      case 'en_proceso':
        return { bg: '#fef9c3', text: '#a16207', label: 'En proceso' };
      case 'pendiente':
        return { bg: '#eff6ff', text: '#1d4ed8', label: 'Pendiente' };
      case 'cancelada':
        return { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelada' };
    }
  };

  if (isLoading) {
    return (
      <p style={{ color: 'var(--color-ink-600)', fontFamily: 'var(--font-body)' }}>
        Cargando mantenciones…
      </p>
    );
  }

  return (
    <div className="mantenciones-page" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* CABECERA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1 className="mantenciones-page__title" style={{ margin: 0 }}>
            {esAlcanceCompania && user?.compania
              ? `Mantenciones — ${user.compania}`
              : 'Gestión de Mantenciones'}
          </h1>
          <p
            style={{
              color: 'var(--color-ink-600)',
              fontFamily: 'var(--font-body)',
              margin: '4px 0 0',
              fontSize: '0.9375rem',
            }}
          >
            Control de mantenciones preventivas, correctivas y emergencias de la flota.
          </p>
        </div>

        {modo === 'lista' ? (
          puedeCrearMantencion && (
            <button
              onClick={handleAbrirFormularioCrear}
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
              + Registrar Nueva Mantención
            </button>
          )
        ) : (
          <button
            onClick={() => setModo('lista')}
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
            ← Volver al Listado
          </button>
        )}
      </div>

      {/* FORMULARIO DE NUEVA MANTENCIÓN */}
      {modo === 'crear' ? (
        <div
          style={{
            maxWidth: 720,
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
            Nueva Orden de Mantención
          </h2>

          {errorForm && (
            <p className="mantenciones-page__alert" role="alert" style={{ maxWidth: '100%' }}>
              {errorForm}
            </p>
          )}

          <form onSubmit={handleCrearMantencion}>
            <div className="mantenciones-form__field" style={{ maxWidth: '100%' }}>
              <label htmlFor="personal-cargo-mant">
                Personal a cargo de la mantención <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id="personal-cargo-mant"
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
                  backgroundColor: '#f8fafc',
                  color: 'var(--color-ink-700)',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <div className="mantenciones-form__field" style={{ maxWidth: '100%' }}>
              <label>Tipo de Mantención</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    border:
                      formTipo === 'preventiva'
                        ? '2px solid #16a34a'
                        : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: formTipo === 'preventiva' ? '#f0fdf4' : 'var(--color-white)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value="preventiva"
                    checked={formTipo === 'preventiva'}
                    onChange={() => setFormTipo('preventiva')}
                    style={{ display: 'none' }}
                  />
                  <strong style={{ color: '#15803d', fontSize: '0.875rem' }}>🟢 Preventiva</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', marginTop: '2px' }}>
                    Prevención periódica
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    border:
                      formTipo === 'correctiva'
                        ? '2px solid #eab308'
                        : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: formTipo === 'correctiva' ? '#fefce8' : 'var(--color-white)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value="correctiva"
                    checked={formTipo === 'correctiva'}
                    onChange={() => setFormTipo('correctiva')}
                    style={{ display: 'none' }}
                  />
                  <strong style={{ color: '#a16207', fontSize: '0.875rem' }}>🟡 Correctiva</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', marginTop: '2px' }}>
                    Mantención por desgaste
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    border:
                      formTipo === 'revision'
                        ? '2px solid #2563eb'
                        : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: formTipo === 'revision' ? '#eff6ff' : 'var(--color-white)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value="revision"
                    checked={formTipo === 'revision'}
                    onChange={() => setFormTipo('revision')}
                    style={{ display: 'none' }}
                  />
                  <strong style={{ color: '#1d4ed8', fontSize: '0.875rem' }}>🔵 Revisión</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', marginTop: '2px' }}>
                    Revisión anual
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    border:
                      formTipo === 'emergencia'
                        ? '2px solid #dc2626'
                        : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: formTipo === 'emergencia' ? '#fef2f2' : 'var(--color-white)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value="emergencia"
                    checked={formTipo === 'emergencia'}
                    onChange={() => setFormTipo('emergencia')}
                    style={{ display: 'none' }}
                  />
                  <strong style={{ color: '#b91c1c', fontSize: '0.875rem' }}>🔴 Emergencia</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', marginTop: '2px' }}>
                    Falla crítica urgente
                  </span>
                </label>
              </div>
            </div>

            <div className="mantenciones-form__field" style={{ maxWidth: '100%' }}>
              <label htmlFor="compania-mant-select">
                Compañía <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="compania-mant-select"
                disabled={esAlcanceCompania}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: esAlcanceCompania ? '#f8fafc' : 'var(--color-white)',
                  cursor: esAlcanceCompania ? 'not-allowed' : 'pointer',
                }}
                value={
                  esAlcanceCompania && user?.id_compania
                    ? String(user.id_compania)
                    : formIdCompania
                }
                onChange={(e) => {
                  setFormIdCompania(e.target.value);
                  setFormIdVehiculo('');
                  setFormKilometraje('');
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

            <div className="mantenciones-form__field" style={{ maxWidth: '100%' }}>
              <label htmlFor="vehiculo-select">Vehículo a intervenir</label>
              <select
                id="vehiculo-select"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={formIdVehiculo}
                onChange={(e) =>
                  e.target.value === ''
                    ? setFormIdVehiculo('')
                    : handleCambiarVehiculo(Number(e.target.value))
                }
                disabled={vehiculosParaMantencion.length === 0}
                required
              >
                <option value="" disabled>
                  {vehiculosParaMantencion.length === 0
                    ? 'No hay vehículos registrados en esta compañía'
                    : 'Selecciona vehículo a intervenir…'}
                </option>
                {vehiculosParaMantencion.map((v) => (
                  <option key={v.id_vehiculo} value={v.id_vehiculo}>
                    {v.nomenclatura ? `${v.nomenclatura} (${v.patente})` : v.patente} — {v.marca}{' '}
                    {v.modelo} (Estado: {v.estado_operativo}
                    {v.kilometraje
                      ? ` | Odómetro: ${Number(v.kilometraje).toLocaleString('es-CL')} km`
                      : ''}
                    )
                  </option>
                ))}
              </select>
            </div>

            <div className="mantenciones-form__field" style={{ maxWidth: '100%' }}>
              <label htmlFor="descripcion-m">Descripción del trabajo y/o falla detectada</label>
              <textarea
                id="descripcion-m"
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="Ej: mantención de 10.000 km, cambio de correas, o falla en bomba de agua..."
                required
              />
            </div>

            <div
              className="mantenciones-form__row"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: '16px',
                width: '100%',
              }}
            >
              <div className="mantenciones-form__field" style={{ minWidth: 0 }}>
                <label htmlFor="km-ingreso">Kilometraje al ingreso (km)</label>
                <input
                  id="km-ingreso"
                  type="number"
                  min={0}
                  style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                  placeholder="Ej: 52000"
                  value={formKilometraje}
                  onChange={(e) =>
                    setFormKilometraje(e.target.value === '' ? '' : Number(e.target.value))
                  }
                />
              </div>

              <div className="mantenciones-form__field" style={{ minWidth: 0 }}>
                <label htmlFor="costo-mo">Costo Mano de Obra (CLP)</label>
                <input
                  id="costo-mo"
                  type="number"
                  min={0}
                  style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                  value={formCostoMO}
                  onChange={(e) => setFormCostoMO(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mantenciones-form__field" style={{ maxWidth: '100%' }}>
              <label htmlFor="taller-ext">Taller externo (opcional)</label>
              <input
                id="taller-ext"
                type="text"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="Dejar vacío si el trabajo se realiza en taller interno"
                value={formTallerExterno}
                onChange={(e) => setFormTallerExterno(e.target.value)}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: 'var(--space-4)',
              }}
            >
              <button
                type="button"
                onClick={() => setModo('lista')}
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
                disabled={isSavingMantencion || !formIdVehiculo}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  color: 'var(--color-white)',
                  backgroundColor: 'var(--color-navy-900)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 18px',
                  cursor: isSavingMantencion ? 'not-allowed' : 'pointer',
                }}
              >
                {isSavingMantencion ? 'Guardando…' : 'Crear Mantención'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* VISTA LISTADO DE MANTENCIONES */
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
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
                  color: '#15803d',
                  textTransform: 'uppercase',
                }}
              >
                🟢 Preventivas
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: '4px 0 0',
                  color: '#16a34a',
                }}
              >
                {mantencionesFiltradas.filter((m) => m.tipo_mantencion === 'preventiva').length}
              </p>
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
                  color: '#a16207',
                  textTransform: 'uppercase',
                }}
              >
                🟡 Correctivas
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: '4px 0 0',
                  color: '#eab308',
                }}
              >
                {mantencionesFiltradas.filter((m) => m.tipo_mantencion === 'correctiva').length}
              </p>
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
                  color: '#1d4ed8',
                  textTransform: 'uppercase',
                }}
              >
                🔵 Revisiones
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: '4px 0 0',
                  color: '#2563eb',
                }}
              >
                {mantencionesFiltradas.filter((m) => m.tipo_mantencion === 'revision').length}
              </p>
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
                  color: '#b91c1c',
                  textTransform: 'uppercase',
                }}
              >
                🔴 Emergencias
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  margin: '4px 0 0',
                  color: '#dc2626',
                }}
              >
                {mantencionesFiltradas.filter((m) => m.tipo_mantencion === 'emergencia').length}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-4)',
            }}
          >
            {puedeVerTodasCompanias && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--color-ink-900)',
                  }}
                >
                  Compañía:
                </label>
                <select
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    padding: '6px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-white)',
                    maxWidth: '220px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                  value={idCompania}
                  onChange={(e) => setIdCompania(e.target.value)}
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
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-ink-900)',
                }}
              >
                Tipo de mantención:
              </label>
              <select
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  padding: '6px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-white)',
                }}
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as TipoMantencion | '')}
              >
                <option value="">Todas</option>
                <option value="preventiva">Preventiva (planificada)</option>
                <option value="correctiva">Correctiva (por desgaste)</option>
                <option value="revision">Revisión (anual)</option>
                <option value="emergencia">Emergencia (crítica)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-ink-900)',
                }}
              >
                Estado:
              </label>
              <select
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  padding: '6px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-white)',
                }}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as EstadoMantencion | '')}
              >
                <option value="">Todos</option>
                <option value="en_proceso">En proceso</option>
                <option value="pendiente">Pendiente</option>
                <option value="finalizada">Finalizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Tabla de Mantenciones */}
          {mantencionesFiltradas.length === 0 ? (
            <p className="mantenciones-page__empty">
              No hay registros de mantenciones con los filtros actuales.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="historial-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Vehículo</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Km Ingreso</th>
                    <th>Fecha Ingreso</th>
                    <th>Repuestos Usados</th>
                    <th>Costo Total</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {mantencionesFiltradas.map((m) => {
                    const bTipo = badgeTipo(m.tipo_mantencion);
                    const bEst = badgeEstado(m.estado_mantencion);
                    const repuestosCount = m.detalles_articulos?.length ?? 0;
                    const totalRepuestos =
                      m.detalles_articulos?.reduce(
                        (acc, d) => acc + d.cantidad * Number(d.costo_unitario_historico),
                        0,
                      ) ?? 0;
                    const costoTotal = Number(m.costo_mano_obra) + totalRepuestos;

                    return (
                      <tr key={m.id_mantencion}>
                        <td>
                          <strong>#{m.id_mantencion}</strong>
                        </td>
                        <td>
                          <strong
                            style={{
                              fontFamily: 'var(--font-display)',
                              color: 'var(--color-navy-900)',
                            }}
                          >
                            {m.vehiculo?.patente ?? `Vehículo #${m.id_vehiculo}`}
                          </strong>
                          {m.vehiculo?.marca && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)' }}>
                              {m.vehiculo.marca} {m.vehiculo.modelo}
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              backgroundColor: bTipo.bg,
                              color: bTipo.text,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {bTipo.label}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              backgroundColor: bEst.bg,
                              color: bEst.text,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {bEst.label}
                          </span>
                        </td>
                        <td>
                          {m.kilometraje ? (
                            <strong
                              style={{ fontSize: '0.8125rem', color: 'var(--color-navy-900)' }}
                            >
                              {Number(m.kilometraje).toLocaleString('es-CL')} km
                            </strong>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-400)' }}>
                              —
                            </span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(m.fecha_ingreso).toLocaleDateString('es-CL')}
                        </td>
                        <td>
                          {repuestosCount > 0 ? (
                            <span
                              style={{
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: 'var(--color-navy-900)',
                              }}
                            >
                              📦 {repuestosCount} repuesto(s)
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-400)' }}>
                              Sin repuestos
                            </span>
                          )}
                        </td>
                        <td>
                          <strong>${costoTotal.toLocaleString('es-CL')}</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setMantencionDetalle(m)}
                              style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: 'var(--color-navy-900)',
                                background: 'var(--color-paper)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '4px 10px',
                                cursor: 'pointer',
                              }}
                            >
                              Ver Ficha →
                            </button>
                            {puedeEditarMantencion &&
                              m.estado_mantencion !== 'finalizada' &&
                              m.estado_mantencion !== 'cancelada' && (
                                <button
                                  onClick={() => {
                                    setMantencionDetalle(m);
                                    handleAbrirModalEditar(m);
                                  }}
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
                                  }}
                                >
                                  ✏️ Editar
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* MODAL DETALLE DE MANTENCIÓN Y GESTIÓN DE REPUESTOS */}
      {mantencionDetalle && (
        <Modal
          onClose={() => setMantencionDetalle(null)}
          title={`Ficha de Mantención #${mantencionDetalle.id_mantencion}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                background: '#fafafa',
                padding: '12px 16px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <span
                  style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', display: 'block' }}
                >
                  Vehículo
                </span>
                <strong style={{ fontSize: '1rem', color: 'var(--color-navy-900)' }}>
                  {mantencionDetalle.vehiculo?.patente ??
                    `Vehículo #${mantencionDetalle.id_vehiculo}`}
                </strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-600)' }}>
                  {mantencionDetalle.vehiculo?.marca} {mantencionDetalle.vehiculo?.modelo}
                </div>
              </div>

              <div>
                <span
                  style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', display: 'block' }}
                >
                  Tipo
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    ...badgeTipo(mantencionDetalle.tipo_mantencion),
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginTop: '2px',
                  }}
                >
                  {badgeTipo(mantencionDetalle.tipo_mantencion).label}
                </span>
              </div>

              <div>
                <span
                  style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', display: 'block' }}
                >
                  Estado
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    ...badgeEstado(mantencionDetalle.estado_mantencion),
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginTop: '2px',
                  }}
                >
                  {badgeEstado(mantencionDetalle.estado_mantencion).label}
                </span>
              </div>

              <div>
                <span
                  style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', display: 'block' }}
                >
                  Km al Ingreso
                </span>
                <strong style={{ fontSize: '0.875rem', color: 'var(--color-navy-900)' }}>
                  {mantencionDetalle.kilometraje
                    ? `${Number(mantencionDetalle.kilometraje).toLocaleString('es-CL')} km`
                    : 'No registrado'}
                </strong>
              </div>

              <div>
                <span
                  style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', display: 'block' }}
                >
                  Personal a Cargo
                </span>
                <strong style={{ fontSize: '0.875rem' }}>
                  {mantencionDetalle.usuarioMecanico
                    ? `${mantencionDetalle.usuarioMecanico.nombre} ${mantencionDetalle.usuarioMecanico.apellidos}`
                    : 'Mecánico asignado'}
                </strong>
                {mantencionDetalle.taller_externo && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)' }}>
                    Taller: {mantencionDetalle.taller_externo}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--color-navy-900)',
                  }}
                >
                  Trabajo o Falla Documentada:
                </span>

                {puedeEditarMantencion &&
                  mantencionDetalle.estado_mantencion !== 'finalizada' &&
                  mantencionDetalle.estado_mantencion !== 'cancelada' && (
                    <button
                      type="button"
                      onClick={() => handleAbrirModalEditar(mantencionDetalle)}
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#0369a1',
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      ✏️ Modificar Orden
                    </button>
                  )}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: 'var(--color-ink-900)',
                  background: 'var(--color-paper)',
                  padding: '10px 14px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                }}
              >
                {mantencionDetalle.descripcion_falla || 'Sin observaciones registradas.'}
              </p>
            </div>

            {/* SECCIÓN DE REPUESTOS USADOS EN ESTA MANTENCIÓN */}
            <div style={{ marginTop: 'var(--space-2)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    margin: 0,
                    fontSize: '1.1rem',
                    color: 'var(--color-navy-900)',
                  }}
                >
                  📦 Repuestos Utilizados en esta Mantención
                </h3>

                {puedeEditarMantencion &&
                  mantencionDetalle.estado_mantencion !== 'finalizada' &&
                  mantencionDetalle.estado_mantencion !== 'cancelada' && (
                    <button
                      onClick={() => {
                        setErrorRepuesto(null);
                        setModalRepuestoAbierto(true);
                      }}
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        color: 'var(--color-white)',
                        backgroundColor: 'var(--color-navy-900)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      + Imputar Repuesto Usado
                    </button>
                  )}
              </div>

              {!mantencionDetalle.detalles_articulos ||
              mantencionDetalle.detalles_articulos.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    padding: '16px',
                    background: '#fafafa',
                    border: '1px dashed var(--color-border)',
                    borderRadius: '4px',
                    textAlign: 'center',
                    color: 'var(--color-ink-600)',
                    fontSize: '0.875rem',
                  }}
                >
                  No se han imputado repuestos a esta mantención todavía.
                </p>
              ) : (
                <table
                  className="historial-table"
                  style={{ border: '1px solid var(--color-border)', fontSize: '0.875rem' }}
                >
                  <thead>
                    <tr>
                      <th>Repuesto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mantencionDetalle.detalles_articulos.map((d) => (
                      <tr key={d.id_detalle}>
                        <td>
                          <strong>
                            {d.articulo?.nombre_articulo ?? `Repuesto #${d.id_articulo}`}
                          </strong>
                        </td>
                        <td>{d.cantidad} u.</td>
                        <td>${Number(d.costo_unitario_historico).toLocaleString('es-CL')}</td>
                        <td>
                          <strong>
                            $
                            {(d.cantidad * Number(d.costo_unitario_historico)).toLocaleString(
                              'es-CL',
                            )}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {(() => {
                const totalRep =
                  mantencionDetalle.detalles_articulos?.reduce(
                    (acc, d) => acc + d.cantidad * Number(d.costo_unitario_historico),
                    0,
                  ) ?? 0;
                const mo = Number(mantencionDetalle.costo_mano_obra);
                const granTotal = mo + totalRep;

                return (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      marginTop: '12px',
                      gap: '4px',
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '10px',
                    }}
                  >
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-600)' }}>
                      Mano de Obra: <strong>${mo.toLocaleString('es-CL')}</strong>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-600)' }}>
                      Total Repuestos: <strong>${totalRep.toLocaleString('es-CL')}</strong>
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--color-navy-900)' }}>
                      Costo Total de la Mantención:{' '}
                      <strong style={{ color: '#16a34a', fontSize: '1.125rem' }}>
                        ${granTotal.toLocaleString('es-CL')}
                      </strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '16px',
                marginTop: '8px',
              }}
            >
              <div>
                {puedeFinalizarMantencion &&
                  mantencionDetalle.estado_mantencion !== 'finalizada' &&
                  mantencionDetalle.estado_mantencion !== 'cancelada' && (
                    <button
                      onClick={() => handleFinalizarMantencion(mantencionDetalle)}
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: 'var(--color-white)',
                        backgroundColor: '#16a34a',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 16px',
                        cursor: 'pointer',
                      }}
                    >
                      ✓ Finalizar Mantención y Dejar Vehículo Operativo
                    </button>
                  )}
              </div>

              <button
                onClick={() => setMantencionDetalle(null)}
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
                Cerrar Ficha
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* SUB-MODAL PARA MODIFICAR ORDEN DE MANTENCIÓN */}
      {modalEditarAbierto && mantencionDetalle && (
        <Modal
          onClose={() => setModalEditarAbierto(false)}
          title={`Modificar Orden de Mantención #${mantencionDetalle.id_mantencion}`}
        >
          {errorEdicion && (
            <p
              style={{
                color: '#b91c1c',
                background: '#fee2e2',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '0.875rem',
                margin: '0 0 16px',
              }}
            >
              {errorEdicion}
            </p>
          )}

          <form
            onSubmit={handleGuardarEdicion}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Tipo de Mantención</label>
                <select
                  value={editTipo}
                  onChange={(e) => setEditTipo(e.target.value as TipoMantencion)}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-white)',
                  }}
                >
                  <option value="preventiva">🟢 Preventiva</option>
                  <option value="correctiva">🟡 Correctiva</option>
                  <option value="revision">🔵 Revisión</option>
                  <option value="emergencia">🔴 Emergencia</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Estado de la Orden</label>
                <select
                  value={editEstado}
                  onChange={(e) => setEditEstado(e.target.value as EstadoMantencion)}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-white)',
                  }}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En proceso</option>
                  {puedeFinalizarMantencion && <option value="finalizada">Finalizada</option>}
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                Descripción del trabajo / falla
              </label>
              <textarea
                rows={3}
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                required
                style={{
                  padding: '8px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Kilometraje al ingreso (km)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editKilometraje}
                  onChange={(e) =>
                    setEditKilometraje(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  style={{
                    padding: '8px 10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Costo Mano de Obra (CLP)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editCostoMO}
                  onChange={(e) => setEditCostoMO(Number(e.target.value))}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                Taller externo (opcional)
              </label>
              <input
                type="text"
                value={editTallerExterno}
                onChange={(e) => setEditTallerExterno(e.target.value)}
                placeholder="Taller interno si queda vacío"
                style={{
                  padding: '8px 10px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'flex-end',
                marginTop: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => setModalEditarAbierto(false)}
                style={{
                  padding: '8px 14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingEdicion}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-navy-900)',
                  color: 'var(--color-white)',
                  fontWeight: 600,
                  cursor: isSavingEdicion ? 'not-allowed' : 'pointer',
                }}
              >
                {isSavingEdicion ? 'Guardando…' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* SUB-MODAL PARA IMPUTAR REPUESTO */}
      {modalRepuestoAbierto && (
        <Modal
          onClose={() => setModalRepuestoAbierto(false)}
          title="Imputar Repuesto a esta Mantención"
        >
          {errorRepuesto && (
            <p
              style={{
                color: '#b91c1c',
                background: '#fee2e2',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '0.875rem',
                margin: '0 0 16px',
              }}
            >
              {errorRepuesto}
            </p>
          )}

          <form
            onSubmit={handleAgregarRepuesto}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--color-ink-900)',
                }}
              >
                Seleccionar Repuesto del Inventario
              </label>
              <select
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-white)',
                }}
                value={idArticuloSeleccionado}
                onChange={(e) => setIdArticuloSeleccionado(Number(e.target.value))}
                required
              >
                <option value="" disabled>
                  Selecciona un repuesto...
                </option>
                {articulosDisponiblesModal.map((art) => (
                  <option
                    key={art.id_articulo}
                    value={art.id_articulo}
                    disabled={art.stock_actual <= 0}
                  >
                    {art.nombre_articulo} — Stock actual: {art.stock_actual} ($
                    {Number(art.costo_unitario_actual).toLocaleString('es-CL')} c/u)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--color-ink-900)',
                }}
              >
                Cantidad Utilizada
              </label>
              <input
                type="number"
                min={1}
                value={cantidadRepuesto}
                onChange={(e) => setCantidadRepuesto(Number(e.target.value))}
                required
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                justifyContent: 'flex-end',
                marginTop: 'var(--space-4)',
              }}
            >
              <button
                type="button"
                onClick={() => setModalRepuestoAbierto(false)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3) var(--space-4)',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingRepuesto || !idArticuloSeleccionado}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  color: 'var(--color-white)',
                  backgroundColor: 'var(--color-navy-900)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3) var(--space-4)',
                  cursor: isSavingRepuesto ? 'not-allowed' : 'pointer',
                }}
              >
                {isSavingRepuesto ? 'Imputando…' : 'Imputar y Descontar de Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}