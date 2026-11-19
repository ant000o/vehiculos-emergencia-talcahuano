import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarArticulos,
  actualizarArticulo,
  listarMovimientos,
  crearMovimientoInventario,
  type ArticuloInventario,
  type MovimientoInventario,
} from '../../services/inventario';
import { listarCompanias, formatoNombreCompania, type CompaniaOption } from '../../services/usuarios';
import { Modal } from '../../components/Modal';
import './inventario.css';

export function InventarioPage() {
  const { user, hasPermission, getScope } = useAuth();
  const userRol = (user?.rol || '').toLowerCase().trim();
  const esAdmin = userRol === 'administrador';
  const scope = getScope('inventario');
  const esAlcanceCompania = scope === 'COMPANY' && Boolean(user?.id_compania);
  const puedeVerTodasCompanias = scope === 'GLOBAL' || esAdmin;
  const puedeCrearInventario = hasPermission('inventario', 'create') || esAdmin;
  const puedeEditarInventario = hasPermission('inventario', 'update') || esAdmin;

  const [articulos, setArticulos] = useState<ArticuloInventario[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [companias, setCompanias] = useState<CompaniaOption[]>([]);
  const [pestana, setPestana] = useState<'articulos' | 'kardex'>('articulos');
  const [filtroStock, setFiltroStock] = useState<'todos' | 'por_reponer' | 'criticos'>('todos');
  const [isLoading, setIsLoading] = useState(true);

  // Filtro de Compañía en la vista principal
  const [idCompania, setIdCompania] = useState<string>(() => {
    return esAlcanceCompania && user?.id_compania ? String(user.id_compania) : '';
  });

  // Modal para Entrada de Stock
  const [modalAbierto, setModalAbierto] = useState(false);
  const [idCompaniaModal, setIdCompaniaModal] = useState<string>(() => {
    return esAlcanceCompania && user?.id_compania ? String(user.id_compania) : '';
  });
  const [idArticuloSeleccionado, setIdArticuloSeleccionado] = useState<number | ''>('');
  const [cantidadEntrada, setCantidadEntrada] = useState<number>(1);
  const [observacionEntrada, setObservacionEntrada] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Modal para Modificar Artículo
  const [articuloEditando, setArticuloEditando] = useState<ArticuloInventario | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCostoUnitario, setEditCostoUnitario] = useState<number>(0);
  const [editStockActual, setEditStockActual] = useState<number>(0);
  const [editIdCompania, setEditIdCompania] = useState<string>('');
  const [editMotivoAjuste, setEditMotivoAjuste] = useState('');
  const [isSavingEdicion, setIsSavingEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  const cargarDatos = async (ciaFiltro?: string) => {
    try {
      const ciaQuery =
        esAlcanceCompania && user?.id_compania
          ? user.id_compania
          : ciaFiltro !== undefined
          ? ciaFiltro
            ? Number(ciaFiltro)
            : undefined
          : idCompania
          ? Number(idCompania)
          : undefined;

      const [art, mov, comps] = await Promise.all([
        listarArticulos(ciaQuery),
        listarMovimientos(),
        listarCompanias().catch(() => []),
      ]);
      const artOrdenados = [...art].sort((a, b) => a.id_articulo - b.id_articulo);
      const movOrdenados = [...mov].sort(
        (a, b) =>
          new Date(b.fecha_movimiento).getTime() - new Date(a.fecha_movimiento).getTime() ||
          b.id_movimiento - a.id_movimiento,
      );
      const compsOrdenadas = [...comps].sort(
        (a, b) => (a.numero_compania ?? a.id_compania) - (b.numero_compania ?? b.id_compania),
      );
      setArticulos(artOrdenados);
      setMovimientos(movOrdenados);
      setCompanias(compsOrdenadas);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const nombreCompaniaActiva = useMemo(() => {
    if (esAlcanceCompania && user?.compania) return user.compania;
    if (idCompania) {
      const match = companias.find((c) => String(c.id_compania) === idCompania);
      return match ? match.nombre : 'Compañía seleccionada';
    }
    return 'Todas las Compañías (Consolidado Institucional)';
  }, [idCompania, companias, esAlcanceCompania, user?.compania]);

  const articulosModalFiltrados = useMemo(() => {
    const ciaObjetivo =
      esAlcanceCompania && user?.id_compania ? String(user.id_compania) : idCompaniaModal;
    if (!ciaObjetivo) return articulos;
    return articulos.filter((a) => String(a.id_compania) === ciaObjetivo);
  }, [articulos, esAlcanceCompania, user?.id_compania, idCompaniaModal]);

  const movimientosFiltrados = useMemo(() => {
    const ciaActiva =
      esAlcanceCompania && user?.id_compania ? String(user.id_compania) : idCompania;
    if (!ciaActiva) return movimientos;
    const idsArticulosCia = new Set(articulos.map((a) => a.id_articulo));
    return movimientos.filter((m) => idsArticulosCia.has(m.id_articulo));
  }, [movimientos, articulos, idCompania, esAlcanceCompania, user?.id_compania]);

  const STOCK_MINIMO_ACEPTABLE = 10;
  const articulosCriticos = articulos.filter((a) => a.stock_actual <= 6);
  const articulosPorReponer = articulos.filter((a) => a.stock_actual < STOCK_MINIMO_ACEPTABLE);

  const totalUnidadesFaltantes = articulos.reduce(
    (acc, a) => acc + Math.max(0, STOCK_MINIMO_ACEPTABLE - a.stock_actual),
    0,
  );

  const articulosFiltrados = articulos.filter((a) => {
    if (filtroStock === 'criticos') return a.stock_actual <= 6;
    if (filtroStock === 'por_reponer') return a.stock_actual < STOCK_MINIMO_ACEPTABLE;
    return true;
  });

  function renderEstadoStock(stock: number) {
    if (stock <= 6) {
      return <span className="inventario-badge is-critico">⚠️ Crítico</span>;
    }
    if (stock < STOCK_MINIMO_ACEPTABLE) {
      return <span className="inventario-badge is-bajo">⚡ Bajo</span>;
    }
    return <span className="inventario-badge is-ok">✓ Aceptable</span>;
  }

  const handleAbrirModalEntrada = () => {
    setErrorModal(null);
    setIdArticuloSeleccionado('');
    setCantidadEntrada(1);
    setObservacionEntrada('');
    if (esAlcanceCompania && user?.id_compania) {
      setIdCompaniaModal(String(user.id_compania));
    } else {
      setIdCompaniaModal(idCompania || (companias[0] ? String(companias[0].id_compania) : ''));
    }
    setModalAbierto(true);
  };

  const handleGuardarEntrada = async (e: FormEvent) => {
    e.preventDefault();
    if (!puedeCrearInventario) return;
    if (!idArticuloSeleccionado || cantidadEntrada < 1) return;

    setIsSaving(true);
    setErrorModal(null);

    try {
      await crearMovimientoInventario({
        tipo_movimiento: 'entrada',
        cantidad: Number(cantidadEntrada),
        id_articulo: Number(idArticuloSeleccionado),
        observacion: observacionEntrada.trim() || 'Ingreso manual de stock',
        id_usuario: user?.id,
      });
      setModalAbierto(false);
      setObservacionEntrada('');
      setCantidadEntrada(1);
      setIdArticuloSeleccionado('');
      await cargarDatos();
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : 'Error al registrar entrada de stock.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAbrirModalEditar = (art: ArticuloInventario) => {
    setErrorEdicion(null);
    setArticuloEditando(art);
    setEditNombre(art.nombre_articulo);
    setEditCostoUnitario(Number(art.costo_unitario_actual) || 0);
    setEditStockActual(Number(art.stock_actual) || 0);
    setEditIdCompania(art.id_compania ? String(art.id_compania) : '');
    setEditMotivoAjuste('');
  };

  const handleGuardarEdicionArticulo = async (e: FormEvent) => {
    e.preventDefault();
    if (!puedeEditarInventario || !articuloEditando) return;
    if (!editNombre.trim()) {
      setErrorEdicion('El nombre del artículo es obligatorio.');
      return;
    }
    if (editStockActual < 0 || editCostoUnitario < 0) {
      setErrorEdicion('El stock y el costo unitario no pueden ser negativos.');
      return;
    }

    setIsSavingEdicion(true);
    setErrorEdicion(null);

    try {
      await actualizarArticulo(articuloEditando.id_articulo, {
        nombre_articulo: editNombre.trim(),
        costo_unitario_actual: Number(editCostoUnitario),
        ...(editIdCompania && !esAlcanceCompania ? { id_compania: Number(editIdCompania) } : {}),
      });

      const diferenciaStock = Number(editStockActual) - Number(articuloEditando.stock_actual);
      if (diferenciaStock !== 0) {
        await crearMovimientoInventario({
          tipo_movimiento: diferenciaStock > 0 ? 'entrada' : 'salida',
          cantidad: Math.abs(diferenciaStock),
          id_articulo: articuloEditando.id_articulo,
          observacion:
            editMotivoAjuste.trim() ||
            `Ajuste manual de inventario (${articuloEditando.stock_actual} → ${editStockActual} u.)`,
          id_usuario: user?.id,
        });
      }

      setArticuloEditando(null);
      await cargarDatos();
    } catch (err) {
      setErrorEdicion(err instanceof Error ? err.message : 'Error al modificar el artículo.');
    } finally {
      setIsSavingEdicion(false);
    }
  };

  if (isLoading) {
    return (
      <p style={{ color: 'var(--color-ink-600)', fontFamily: 'var(--font-body)' }}>
        Cargando inventario…
      </p>
    );
  }

  return (
    <div className="inventario-page">
      <div className="inventario-page__header">
        <div>
          <h1 className="inventario-page__title">
            {esAlcanceCompania && user?.compania
              ? `Inventario — ${user.compania}`
              : 'Inventario y Repuestos'}
          </h1>
          <p className="inventario-page__subtitle">
            Control de existencias de repuestos, alertas de stock crítico y kardex de movimientos —{' '}
            <strong>{nombreCompaniaActiva}</strong>.
          </p>
        </div>

        {puedeCrearInventario && (
          <button className="inventario-page__nuevo" onClick={handleAbrirModalEntrada}>
            + Registrar Entrada de Stock
          </button>
        )}
      </div>

      {/* Tarjetas resumen */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            background: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-ink-600)',
              textTransform: 'uppercase',
            }}
          >
            Total Artículos
          </span>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 700,
              margin: '4px 0 0',
              color: 'var(--color-navy-900)',
            }}
          >
            {articulos.length}
          </p>
        </div>

        <div
          style={{
            background: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
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
            En Stock Crítico (≤ 6)
          </span>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 700,
              margin: '4px 0 0',
              color: '#dc2626',
            }}
          >
            {articulosCriticos.length}
          </p>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-ink-500)',
              display: 'block',
              marginTop: '2px',
            }}
          >
            Riesgo de quiebre de stock
          </span>
        </div>

        <div
          style={{
            background: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#0369a1',
              textTransform: 'uppercase',
            }}
          >
            Unidades por Reponer
          </span>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 700,
              margin: '4px 0 0',
              color: '#0284c7',
            }}
          >
            {totalUnidadesFaltantes}
          </p>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-ink-500)',
              display: 'block',
              marginTop: '2px',
            }}
          >
            Mín. aceptable: {STOCK_MINIMO_ACEPTABLE} u.
          </span>
        </div>

        <div
          style={{
            background: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-ink-600)',
              textTransform: 'uppercase',
            }}
          >
            Movimientos Registrados
          </span>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.75rem',
              fontWeight: 700,
              margin: '4px 0 0',
              color: 'var(--color-navy-900)',
            }}
          >
            {movimientosFiltrados.length}
          </p>
        </div>
      </div>

      {/* Pestañas + Selector de Compañía */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div className="inventario-page__tabs" style={{ marginBottom: 0 }}>
          <button
            className={`inventario-page__tab ${pestana === 'articulos' ? 'is-active' : ''}`}
            onClick={() => setPestana('articulos')}
          >
            Stock de Artículos ({articulos.length})
          </button>
          <button
            className={`inventario-page__tab ${pestana === 'kardex' ? 'is-active' : ''}`}
            onClick={() => setPestana('kardex')}
          >
            Kardex de Movimientos ({movimientosFiltrados.length})
          </button>
        </div>

        {puedeVerTodasCompanias && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              htmlFor="select-cia-inv"
              style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-700)' }}
            >
              Compañía:
            </label>
            <select
              id="select-cia-inv"
              value={idCompania}
              onChange={(e) => {
                const nueva = e.target.value;
                setIdCompania(nueva);
                cargarDatos(nueva);
              }}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                padding: '6px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-white)',
                color: 'var(--color-ink-700)',
                fontWeight: 500,
                maxWidth: '240px',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              <option value="">Todas las compañías (Consolidado)</option>
              {companias.map((c) => (
                <option key={c.id_compania} value={c.id_compania} title={c.nombre}>
                  {c.numero_compania
                    ? `${c.numero_compania}ª Cía. — ${c.nombre.replace(/^.*Compañía\s*/i, '')}`
                    : formatoNombreCompania(c.nombre)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Vista de Artículos */}
      {pestana === 'articulos' && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-4)',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label
                htmlFor="filtro-stock"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-ink-700)',
                }}
              >
                Filtrar por nivel de stock:
              </label>
              <select
                id="filtro-stock"
                value={filtroStock}
                onChange={(e) =>
                  setFiltroStock(e.target.value as 'todos' | 'por_reponer' | 'criticos')
                }
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-white)',
                  color: 'var(--color-ink-900)',
                  cursor: 'pointer',
                }}
              >
                <option value="todos">Todos los artículos ({articulos.length})</option>
                <option value="por_reponer">
                  Requieren reposición ({articulosPorReponer.length})
                </option>
                <option value="criticos">Solo stock crítico ({articulosCriticos.length})</option>
              </select>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-500)' }}>
              Mostrando {articulosFiltrados.length} de {articulos.length} artículos
            </span>
          </div>

          <div className="table-responsive">
            <table className="inventario-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre del Repuesto / Artículo</th>
                  <th>Compañía</th>
                  <th>Stock Actual</th>
                  <th>Estado Stock</th>
                  <th>Costo Unitario</th>
                  <th>Faltante para Stock mín</th>
                  {puedeEditarInventario && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {articulosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={puedeEditarInventario ? 8 : 7}
                      style={{
                        textAlign: 'center',
                        color: 'var(--color-ink-400)',
                        padding: 'var(--space-6)',
                      }}
                    >
                      No se encontraron artículos con el criterio seleccionado.
                    </td>
                  </tr>
                ) : (
                  articulosFiltrados.map((art) => {
                    const faltantes = Math.max(0, STOCK_MINIMO_ACEPTABLE - art.stock_actual);
                    const costoFaltante = faltantes * Number(art.costo_unitario_actual);
                    const colorStock =
                      art.stock_actual <= 6
                        ? '#b91c1c'
                        : art.stock_actual < STOCK_MINIMO_ACEPTABLE
                        ? '#b45309'
                        : '#15803d';
                    const nombreCiaArt =
                      art.compania?.nombre ||
                      companias.find((c) => c.id_compania === art.id_compania)?.nombre ||
                      'Compañía';

                    return (
                      <tr key={art.id_articulo}>
                        <td>
                          <strong>#{art.id_articulo}</strong>
                        </td>
                        <td style={{ fontWeight: 500 }}>{art.nombre_articulo}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '0.8125rem',
                              color: 'var(--color-ink-700)',
                              fontWeight: 500,
                            }}
                          >
                            🏢 {nombreCiaArt}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: '1rem', color: colorStock }}>
                            {art.stock_actual}
                          </strong>{' '}
                          u.
                        </td>
                        <td>{renderEstadoStock(art.stock_actual)}</td>
                        <td>${Number(art.costo_unitario_actual).toLocaleString('es-CL')}</td>
                        <td>
                          {faltantes > 0 ? (
                            <div>
                              <strong
                                style={{ color: art.stock_actual <= 6 ? '#b91c1c' : '#b45309' }}
                              >
                                Faltan {faltantes} unidades.
                              </strong>
                              <div
                                style={{
                                  fontSize: '0.8125rem',
                                  color: 'var(--color-ink-600)',
                                  marginTop: '2px',
                                }}
                              >
                                ${costoFaltante.toLocaleString('es-CL')} estimado
                              </div>
                            </div>
                          ) : (
                            <span
                              style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: 500 }}
                            >
                              Completo
                            </span>
                          )}
                        </td>
                        {puedeEditarInventario && (
                          <td>
                            <button
                              type="button"
                              onClick={() => handleAbrirModalEditar(art)}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Vista de Movimientos (Kardex) */}
      {pestana === 'kardex' && (
        <div className="table-responsive">
          <table className="inventario-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Artículo</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Motivo / Observación</th>
                <th>Personal Responsable</th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      color: 'var(--color-ink-400)',
                      padding: 'var(--space-6)',
                    }}
                  >
                    No hay movimientos registrados en el kardex para esta selección.
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((m) => (
                  <tr key={m.id_movimiento}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(m.fecha_movimiento).toLocaleString('es-CL')}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {m.articulo?.nombre_articulo ?? `Artículo #${m.id_articulo}`}
                    </td>
                    <td>
                      <span
                        className={`inventario-badge ${
                          m.tipo_movimiento === 'entrada' ? 'is-entrada' : 'is-salida'
                        }`}
                      >
                        {m.tipo_movimiento === 'entrada' ? '↓ Entrada' : '↑ Salida (Consumo)'}
                      </span>
                    </td>
                    <td>
                      <strong
                        style={{
                          color: m.tipo_movimiento === 'entrada' ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {m.tipo_movimiento === 'entrada' ? `+${m.cantidad}` : `-${m.cantidad}`}
                      </strong>
                    </td>
                    <td>
                      {m.observacion || <span style={{ color: 'var(--color-ink-400)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-ink-700)' }}>
                      {m.usuario?.email ? (
                        <span>
                          👤 {m.usuario.nombre} {m.usuario.apellidos} ({m.usuario.email})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-ink-400)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para Ingresar Stock */}
      {modalAbierto && (
        <Modal onClose={() => setModalAbierto(false)} title="Registrar Entrada de Repuestos / Stock">
          {errorModal && (
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
              {errorModal}
            </p>
          )}

          <form
            onSubmit={handleGuardarEntrada}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-navy-900)',
                }}
              >
                Personal a cargo <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                readOnly
                value={
                  user?.email
                    ? `${user.nombre} ${user.apellidos} (${user.email})`
                    : 'Usuario autenticado'
                }
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#f8fafc',
                  color: 'var(--color-ink-700)',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label
                htmlFor="compania-modal-inv"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-navy-900)',
                }}
              >
                Compañía de Bodega <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                id="compania-modal-inv"
                disabled={esAlcanceCompania}
                value={
                  esAlcanceCompania && user?.id_compania
                    ? String(user.id_compania)
                    : idCompaniaModal
                }
                onChange={(e) => {
                  const nuevaCia = e.target.value;
                  setIdCompaniaModal(nuevaCia);
                  setIdArticuloSeleccionado('');
                  if (!esAlcanceCompania) {
                    setIdCompania(nuevaCia);
                    cargarDatos(nuevaCia);
                  }
                }}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: esAlcanceCompania ? '#f8fafc' : 'var(--color-white)',
                  color: 'var(--color-ink-900)',
                  cursor: esAlcanceCompania ? 'not-allowed' : 'pointer',
                }}
                required
              >
                <option value="" disabled>
                  Selecciona una compañía…
                </option>
                {companias.map((c) => (
                  <option key={c.id_compania} value={c.id_compania}>
                    {c.numero_compania
                      ? `${c.numero_compania}ª Cía. — ${c.nombre.replace(/^.*Compañía\s*/i, '')}`
                      : formatoNombreCompania(c.nombre)}
                  </option>
                ))}
              </select>
              {esAlcanceCompania && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)' }}>
                  Fijada automáticamente según tu compañía asignada.
                </span>
              )}
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
                Seleccionar Artículo / Repuesto
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
                disabled={articulosModalFiltrados.length === 0}
                required
              >
                <option value="" disabled>
                  {articulosModalFiltrados.length === 0
                    ? 'No hay artículos registrados en esta compañía'
                    : 'Selecciona un artículo...'}
                </option>
                {articulosModalFiltrados.map((art) => (
                  <option key={art.id_articulo} value={art.id_articulo}>
                    {art.nombre_articulo} (Stock actual: {art.stock_actual})
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
                Cantidad a Ingresar
              </label>
              <input
                type="number"
                min={1}
                value={cantidadEntrada}
                onChange={(e) => setCantidadEntrada(Number(e.target.value))}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--color-ink-900)',
                }}
              >
                Motivo / Número de Orden de Compra
              </label>
              <input
                type="text"
                placeholder="Ej: Factura #9823 / Compra anual de filtros"
                value={observacionEntrada}
                onChange={(e) => setObservacionEntrada(e.target.value)}
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
                onClick={() => setModalAbierto(false)}
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
                disabled={isSaving || !idArticuloSeleccionado}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  color: 'var(--color-white)',
                  backgroundColor: 'var(--color-navy-900)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3) var(--space-4)',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                {isSaving ? 'Guardando…' : 'Registrar Entrada'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal para Modificar Artículo */}
      {articuloEditando && (
        <Modal
          onClose={() => setArticuloEditando(null)}
          title={`Modificar Artículo #${articuloEditando.id_articulo}`}
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
            onSubmit={handleGuardarEdicionArticulo}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                Nombre del Repuesto / Artículo <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                required
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9375rem',
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </div>

            {!esAlcanceCompania && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Compañía Asignada</label>
                <select
                  value={editIdCompania}
                  onChange={(e) => setEditIdCompania(e.target.value)}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    padding: '8px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-white)',
                  }}
                >
                  <option value="">Sin compañía específica</option>
                  {companias.map((c) => (
                    <option key={c.id_compania} value={c.id_compania}>
                      {c.numero_compania
                        ? `${c.numero_compania}ª Cía. — ${c.nombre.replace(/^.*Compañía\s*/i, '')}`
                        : formatoNombreCompania(c.nombre)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Costo Unitario (CLP) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={editCostoUnitario}
                  onChange={(e) => setEditCostoUnitario(Number(e.target.value))}
                  required
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    padding: '8px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                  Stock Actual (u.) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={editStockActual}
                  onChange={(e) => setEditStockActual(Number(e.target.value))}
                  required
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    padding: '8px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </div>
            </div>

            {Number(editStockActual) !== Number(articuloEditando.stock_actual) && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e' }}>
                  📋 Se registrará automáticamente en el Kardex un movimiento de{' '}
                  {editStockActual > articuloEditando.stock_actual
                    ? `entrada (+${editStockActual - articuloEditando.stock_actual} u.)`
                    : `salida (-${articuloEditando.stock_actual - editStockActual} u.)`}
                </span>
                <input
                  type="text"
                  placeholder="Motivo del ajuste de stock (opcional)"
                  value={editMotivoAjuste}
                  onChange={(e) => setEditMotivoAjuste(e.target.value)}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    padding: '6px 10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-white)',
                  }}
                />
              </div>
            )}

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
                onClick={() => setArticuloEditando(null)}
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