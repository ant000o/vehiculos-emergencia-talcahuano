import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarMantenciones,
  crearMantencion,
  actualizarEstadoMantencion,
  type Mantencion,
  type TipoMantencion,
  type EstadoMantencion,
} from '../../services/mantenciones';
import { listarVehiculos, type Vehiculo } from '../../services/vehiculos';
import { listarArticulos, descontarRepuesto, type ArticuloInventario } from '../../services/inventario';
import { Modal } from '../../components/Modal';
import './mantenciones.css';

export function MantencionesPage() {
  const { user } = useAuth();

  const [mantenciones, setMantenciones] = useState<Mantencion[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [articulos, setArticulos] = useState<ArticuloInventario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<TipoMantencion | ''>('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoMantencion | ''>('');

  // Modo: 'lista' | 'crear'
  const [modo, setModo] = useState<'lista' | 'crear'>('lista');

  // Mantención seleccionada para ver detalles y repuestos
  const [mantencionDetalle, setMantencionDetalle] = useState<Mantencion | null>(null);

  // Modal para agregar repuesto dentro de la mantención seleccionada
  const [modalRepuestoAbierto, setModalRepuestoAbierto] = useState(false);
  const [idArticuloSeleccionado, setIdArticuloSeleccionado] = useState<number | ''>('');
  const [cantidadRepuesto, setCantidadRepuesto] = useState(1);
  const [errorRepuesto, setErrorRepuesto] = useState<string | null>(null);
  const [isSavingRepuesto, setIsSavingRepuesto] = useState(false);

  // Formulario de Nueva Mantención
  const [formTipo, setFormTipo] = useState<TipoMantencion>('preventiva');
  const [formIdVehiculo, setFormIdVehiculo] = useState<number | ''>('');
  const [formKilometraje, setFormKilometraje] = useState<number | ''>('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCostoMO, setFormCostoMO] = useState<number>(0);
  const [formTallerExterno, setFormTallerExterno] = useState('');
  const [isSavingMantencion, setIsSavingMantencion] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      const [mants, vehs, arts] = await Promise.all([
        listarMantenciones(),
        listarVehiculos(),
        listarArticulos(),
      ]);
      setMantenciones(mants);
      setVehiculos(vehs);
      setArticulos(arts.sort((a, b) => a.id_articulo - b.id_articulo));
      if (!formIdVehiculo && vehs.length > 0) {
        setFormIdVehiculo(vehs[0].id_vehiculo);
        if (vehs[0].kilometraje) {
          setFormKilometraje(Number(vehs[0].kilometraje));
        }
      }
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

  // Mantener actualizado el detalle abierto si se recargan las mantenciones
  useEffect(() => {
    if (mantencionDetalle) {
      const actual = mantenciones.find((m) => m.id_mantencion === mantencionDetalle.id_mantencion);
      if (actual) setMantencionDetalle(actual);
    }
  }, [mantenciones]);

  const mantencionesFiltradas = mantenciones.filter((m) => {
    if (filtroTipo && m.tipo_mantencion !== filtroTipo) return false;
    if (filtroEstado && m.estado_mantencion !== filtroEstado) return false;
    return true;
  });

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
        id_usuario_mecanico: formTallerExterno.trim() ? undefined : user.id,
        taller_externo: formTallerExterno.trim() || undefined,
      });

      await cargarDatos();
      setModo('lista');
      setFormDescripcion('');
      setFormCostoMO(0);
      setFormTallerExterno('');
      setFormKilometraje('');
      // Abrir directamente la ficha de la mantención recién creada para que pueda imputar repuestos
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

  // Finalizar mantención
  const handleFinalizarMantencion = async (m: Mantencion) => {
    if (!confirm(`¿Estás seguro de finalizar la mantención #${m.id_mantencion}? El vehículo ${m.vehiculo?.patente ?? ''} volverá automáticamente a estado OPERATIVO.`)) {
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
    return <p style={{ color: 'var(--color-ink-600)', fontFamily: 'var(--font-body)' }}>Cargando mantenciones…</p>;
  }

  return (
    <div className="mantenciones-page" style={{ maxWidth: 1100 }}>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="mantenciones-page__title" style={{ margin: 0 }}>
            Gestión de Mantenciones
          </h1>
          <p style={{ color: 'var(--color-ink-600)', fontFamily: 'var(--font-body)', margin: '4px 0 0', fontSize: '0.9375rem' }}>
            Control de mantenciones preventivas, correctivas, revisiones técnicas y emergencias de la flota.
          </p>
        </div>

        {modo === 'lista' ? (
          <button
            onClick={() => setModo('crear')}
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
        <div style={{ maxWidth: 650, background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-6)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy-900)', margin: '0 0 var(--space-4)', fontSize: '1.25rem' }}>
            Nueva Orden de Mantención
          </h2>

          {errorForm && (
            <p className="mantenciones-page__alert" role="alert" style={{ maxWidth: '100%' }}>
              {errorForm}
            </p>
          )}

          <form onSubmit={handleCrearMantencion}>
            {/* Selector de Tipo de Mantención */}
            <div className="mantenciones-form__field" style={{ maxWidth: '100%' }}>
              <label>Tipo de Mantención</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '4px' }}>
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    border: formTipo === 'preventiva' ? '2px solid #16a34a' : '1px solid var(--color-border)',
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
                    Prevención periódica (filtros, aceite)
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    border: formTipo === 'correctiva' ? '2px solid #eab308' : '1px solid var(--color-border)',
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
                    Cuando le toca arreglo por desgaste
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    border: formTipo === 'revision' ? '2px solid #2563eb' : '1px solid var(--color-border)',
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
                    Revisión anual / técnica general
                  </span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px',
                    border: formTipo === 'emergencia' ? '2px solid #dc2626' : '1px solid var(--color-border)',
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
                    Falla crítica urgente (inoperativo)
                  </span>
                </label>
              </div>
            </div>

            {/* Vehículo */}
            <div className="mantenciones-form__field" style={{ maxWidth: '100%' }}>
              <label htmlFor="vehiculo-select">Vehículo a intervenir</label>
              <select
                id="vehiculo-select"
                value={formIdVehiculo}
                onChange={(e) => handleCambiarVehiculo(Number(e.target.value))}
                required
              >
                {vehiculos.map((v) => (
                  <option key={v.id_vehiculo} value={v.id_vehiculo}>
                    {v.patente} — {v.marca} {v.modelo} (Estado actual: {v.estado_operativo}{v.kilometraje ? ` | Odómetro: ${Number(v.kilometraje).toLocaleString('es-CL')} km` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Falla o Detalle */}
            <div className="mantenciones-form__field" style={{ maxWidth: '100%' }}>
              <label htmlFor="descripcion-m">Descripción del trabajo o falla detectada</label>
              <textarea
                id="descripcion-m"
                rows={3}
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                placeholder="Ej: mantención de 50.000 km, cambio de correas, o falla en bomba de agua..."
                required
              />
            </div>

            <div className="mantenciones-form__row">
              <div className="mantenciones-form__field">
                <label htmlFor="km-ingreso">Kilometraje al ingreso (km)</label>
                <input
                  id="km-ingreso"
                  type="number"
                  min={0}
                  placeholder="Ej: 52000"
                  value={formKilometraje}
                  onChange={(e) => setFormKilometraje(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>

              <div className="mantenciones-form__field">
                <label htmlFor="costo-mo">Costo Mano de Obra (CLP)</label>
                <input
                  id="costo-mo"
                  type="number"
                  min={0}
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
                placeholder="Dejar vacío si atiende mecánico interno"
                value={formTallerExterno}
                onChange={(e) => setFormTallerExterno(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
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
          {/* Tarjetas de Métricas por Tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d', textTransform: 'uppercase' }}>🟢 Preventivas</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, margin: '4px 0 0', color: '#16a34a' }}>
                {mantenciones.filter((m) => m.tipo_mantencion === 'preventiva').length}
              </p>
            </div>

            <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a16207', textTransform: 'uppercase' }}>🟡 Correctivas</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, margin: '4px 0 0', color: '#eab308' }}>
                {mantenciones.filter((m) => m.tipo_mantencion === 'correctiva').length}
              </p>
            </div>

            <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase' }}>🔵 Revisiones</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, margin: '4px 0 0', color: '#2563eb' }}>
                {mantenciones.filter((m) => m.tipo_mantencion === 'revision').length}
              </p>
            </div>

            <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase' }}>🔴 Emergencias</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, margin: '4px 0 0', color: '#dc2626' }}>
                {mantenciones.filter((m) => m.tipo_mantencion === 'emergencia').length}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-ink-900)' }}>
                Tipo:
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
                <option value="">Todos los tipos</option>
                <option value="preventiva">Preventiva (planificada)</option>
                <option value="correctiva">Correctiva (por desgaste)</option>
                <option value="revision">Revisión (anual / técnica)</option>
                <option value="emergencia">Emergencia (crítica)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-ink-900)' }}>
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
                <option value="">Todos los estados</option>
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
            <table className="historial-table" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}>
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
                  const totalRepuestos = m.detalles_articulos?.reduce(
                    (acc, d) => acc + d.cantidad * Number(d.costo_unitario_historico),
                    0,
                  ) ?? 0;
                  const costoTotal = Number(m.costo_mano_obra) + totalRepuestos;

                  return (
                    <tr key={m.id_mantencion}>
                      <td><strong>#{m.id_mantencion}</strong></td>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy-900)' }}>
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
                          <strong style={{ fontSize: '0.8125rem', color: 'var(--color-navy-900)' }}>
                            {Number(m.kilometraje).toLocaleString('es-CL')} km
                          </strong>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-400)' }}>—</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(m.fecha_ingreso).toLocaleDateString('es-CL')}
                      </td>
                      <td>
                        {repuestosCount > 0 ? (
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-navy-900)' }}>
                            📦 {repuestosCount} repuesto(s)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-400)' }}>Sin repuestos</span>
                        )}
                      </td>
                      <td>
                        <strong>${costoTotal.toLocaleString('es-CL')}</strong>
                      </td>
                      <td>
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
                          Ver Ficha / Repuestos →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            {/* Cabecera del detalle */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#fafafa', padding: '12px 16px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', display: 'block' }}>Vehículo</span>
                <strong style={{ fontSize: '1rem', color: 'var(--color-navy-900)' }}>
                  {mantencionDetalle.vehiculo?.patente ?? `Vehículo #${mantencionDetalle.id_vehiculo}`}
                </strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-600)' }}>
                  {mantencionDetalle.vehiculo?.marca} {mantencionDetalle.vehiculo?.modelo}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', display: 'block' }}>Tipo</span>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', display: 'block' }}>Estado</span>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', display: 'block' }}>Km al Ingreso</span>
                <strong style={{ fontSize: '0.875rem', color: 'var(--color-navy-900)' }}>
                  {mantencionDetalle.kilometraje ? `${Number(mantencionDetalle.kilometraje).toLocaleString('es-CL')} km` : 'No registrado'}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-600)', display: 'block' }}>Responsable</span>
                <strong style={{ fontSize: '0.875rem' }}>
                  {mantencionDetalle.taller_externo ||
                    (mantencionDetalle.usuarioMecanico
                      ? `${mantencionDetalle.usuarioMecanico.nombre} ${mantencionDetalle.usuarioMecanico.apellidos}`
                      : 'Mecánico asignado')}
                </strong>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-navy-900)', display: 'block', marginBottom: '2px' }}>
                Trabajo o Falla Documentada:
              </span>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-ink-900)', background: 'var(--color-paper)', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                {mantencionDetalle.descripcion_falla || 'Sin observaciones registradas.'}
              </p>
            </div>

            {/* SECCIÓN DE REPUESTOS USADOS EN ESTA MANTENCIÓN */}
            <div style={{ marginTop: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.1rem', color: 'var(--color-navy-900)' }}>
                  📦 Repuestos Utilizados en esta Mantención
                </h3>

                {mantencionDetalle.estado_mantencion !== 'finalizada' && mantencionDetalle.estado_mantencion !== 'cancelada' && (
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

              {/* Tabla de repuestos */}
              {(!mantencionDetalle.detalles_articulos || mantencionDetalle.detalles_articulos.length === 0) ? (
                <p style={{ margin: 0, padding: '16px', background: '#fafafa', border: '1px dashed var(--color-border)', borderRadius: '4px', textAlign: 'center', color: 'var(--color-ink-600)', fontSize: '0.875rem' }}>
                  No se han imputado repuestos a esta mantención todavía.
                </p>
              ) : (
                <table className="historial-table" style={{ border: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
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
                          <strong>{d.articulo?.nombre_articulo ?? `Repuesto #${d.id_articulo}`}</strong>
                        </td>
                        <td>{d.cantidad} u.</td>
                        <td>${Number(d.costo_unitario_historico).toLocaleString('es-CL')}</td>
                        <td>
                          <strong>${(d.cantidad * Number(d.costo_unitario_historico)).toLocaleString('es-CL')}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Totales */}
              {(() => {
                const totalRep = mantencionDetalle.detalles_articulos?.reduce(
                  (acc, d) => acc + d.cantidad * Number(d.costo_unitario_historico),
                  0,
                ) ?? 0;
                const mo = Number(mantencionDetalle.costo_mano_obra);
                const granTotal = mo + totalRep;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '12px', gap: '4px', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-600)' }}>
                      Mano de Obra: <strong>${mo.toLocaleString('es-CL')}</strong>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-ink-600)' }}>
                      Total Repuestos: <strong>${totalRep.toLocaleString('es-CL')}</strong>
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--color-navy-900)' }}>
                      Costo Total de la Mantención: <strong style={{ color: '#16a34a', fontSize: '1.125rem' }}>${granTotal.toLocaleString('es-CL')}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
              <div>
                {mantencionDetalle.estado_mantencion !== 'finalizada' && mantencionDetalle.estado_mantencion !== 'cancelada' && (
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

      {/* SUB-MODAL PARA IMPUTAR REPUESTO */}
      {modalRepuestoAbierto && (
        <Modal
          onClose={() => setModalRepuestoAbierto(false)}
          title="Imputar Repuesto a esta Mantención"
        >
          {errorRepuesto && (
            <p style={{ color: '#b91c1c', background: '#fee2e2', padding: '8px 12px', borderRadius: '4px', fontSize: '0.875rem', margin: '0 0 16px' }}>
              {errorRepuesto}
            </p>
          )}

          <form onSubmit={handleAgregarRepuesto} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-ink-900)' }}>
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
                <option value="" disabled>Selecciona un repuesto...</option>
                {articulos.map((art) => (
                  <option key={art.id_articulo} value={art.id_articulo} disabled={art.stock_actual <= 0}>
                    {art.nombre_articulo} — Stock actual: {art.stock_actual} (${Number(art.costo_unitario_actual).toLocaleString('es-CL')} c/u)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-ink-900)' }}>
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

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
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
