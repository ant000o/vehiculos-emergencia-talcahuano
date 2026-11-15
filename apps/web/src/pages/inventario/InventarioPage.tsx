import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  listarArticulos,
  listarMovimientos,
  crearMovimientoInventario,
  type ArticuloInventario,
  type MovimientoInventario,
} from '../../services/inventario';
import { Modal } from '../../components/Modal';
import './inventario.css';

export function InventarioPage() {
  const { user } = useAuth();
  const esAdmin = user?.rol === 'administrador';

  const [articulos, setArticulos] = useState<ArticuloInventario[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [pestana, setPestana] = useState<'articulos' | 'kardex'>('articulos');
  const [filtroStock, setFiltroStock] = useState<'todos' | 'por_reponer' | 'criticos'>('todos');
  const [isLoading, setIsLoading] = useState(true);

  // Modal para Entrada de Stock
  const [modalAbierto, setModalAbierto] = useState(false);
  const [idArticuloSeleccionado, setIdArticuloSeleccionado] = useState<number | ''>('');
  const [cantidadEntrada, setCantidadEntrada] = useState<number>(1);
  const [observacionEntrada, setObservacionEntrada] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      const [art, mov] = await Promise.all([
        listarArticulos(),
        listarMovimientos(),
      ]);
      // Artículos: por código de menor a mayor: 1, 2, 3...
      const artOrdenados = [...art].sort((a, b) => a.id_articulo - b.id_articulo);
      // Kardex: por fecha más reciente primero
      const movOrdenados = [...mov].sort(
        (a, b) =>
          new Date(b.fecha_movimiento).getTime() - new Date(a.fecha_movimiento).getTime() ||
          b.id_movimiento - a.id_movimiento,
      );
      setArticulos(artOrdenados);
      setMovimientos(movOrdenados);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Regla de negocio: stock mínimo / aceptable es 10 unidades
  const STOCK_MINIMO_ACEPTABLE = 10;

  // Semáforo:
  // <= 6: Crítico (rojo)
  // 7 a 9: Bajo (amarillo)
  // >= 10: Aceptable / Óptimo (verde)
  const articulosCriticos = articulos.filter((a) => a.stock_actual <= 6);
  const articulosPorReponer = articulos.filter((a) => a.stock_actual < STOCK_MINIMO_ACEPTABLE);

  // Total de unidades faltantes para alcanzar stock aceptable en toda la bodega
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

  const handleGuardarEntrada = async (e: FormEvent) => {
    e.preventDefault();
    if (!esAdmin) return;
    if (!idArticuloSeleccionado || cantidadEntrada < 1) return;

    setIsSaving(true);
    setErrorModal(null);

    try {
      await crearMovimientoInventario({
        tipo_movimiento: 'entrada',
        cantidad: Number(cantidadEntrada),
        id_articulo: Number(idArticuloSeleccionado),
        observacion: observacionEntrada.trim() || 'Ingreso manual de stock',
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

  if (isLoading) {
    return <p style={{ color: 'var(--color-ink-600)', fontFamily: 'var(--font-body)' }}>Cargando inventario…</p>;
  }

  return (
    <div className="inventario-page">
      <div className="inventario-page__header">
        <div>
          <h1 className="inventario-page__title">Inventario y Repuestos</h1>
          <p className="inventario-page__subtitle">
            Control de existencias de repuestos, alertas de stock crítico y kardex de movimientos.
          </p>
        </div>

        {esAdmin && (
          <button
            className="inventario-page__nuevo"
            onClick={() => {
              setErrorModal(null);
              setModalAbierto(true);
            }}
          >
            + Registrar Entrada de Stock
          </button>
        )}
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-600)', textTransform: 'uppercase' }}>Total Artículos</span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, margin: '4px 0 0', color: 'var(--color-navy-900)' }}>
            {articulos.length}
          </p>
        </div>

        <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase' }}>En Stock Crítico (≤ 6)</span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, margin: '4px 0 0', color: '#dc2626' }}>
            {articulosCriticos.length}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)', display: 'block', marginTop: '2px' }}>
            Riesgo de quiebre de stock
          </span>
        </div>

        <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', textTransform: 'uppercase' }}>Unidades por Reponer</span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, margin: '4px 0 0', color: '#0284c7' }}>
            {totalUnidadesFaltantes}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-500)', display: 'block', marginTop: '2px' }}>
            Mín. aceptable: {STOCK_MINIMO_ACEPTABLE} u.
          </span>
        </div>

        <div style={{ background: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px 20px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-ink-600)', textTransform: 'uppercase' }}>Movimientos Registrados</span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, margin: '4px 0 0', color: 'var(--color-navy-900)' }}>
            {movimientos.length}
          </p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="inventario-page__tabs">
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
          Kardex de Movimientos ({movimientos.length})
        </button>
      </div>

      {/* Vista de Artículos */}
      {pestana === 'articulos' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="filtro-stock" style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink-700)' }}>
                Filtrar por nivel de stock:
              </label>
              <select
                id="filtro-stock"
                value={filtroStock}
                onChange={(e) => setFiltroStock(e.target.value as 'todos' | 'por_reponer' | 'criticos')}
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
                <option value="por_reponer">Requieren reposición. ({articulosPorReponer.length})</option>
                <option value="criticos">Solo stock crítico. ({articulosCriticos.length})</option>
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
                <th>Stock Actual</th>
                <th>Estado Stock</th>
                <th>Costo Unitario</th>
                <th>Faltante para Stock mín</th>
              </tr>
            </thead>
            <tbody>
              {articulosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-ink-400)', padding: 'var(--space-6)' }}>
                    No se encontraron artículos con el criterio seleccionado.
                  </td>
                </tr>
              ) : (
                articulosFiltrados.map((art) => {
                  const faltantes = Math.max(0, STOCK_MINIMO_ACEPTABLE - art.stock_actual);
                  const costoFaltante = faltantes * Number(art.costo_unitario_actual);
                  const colorStock = art.stock_actual <= 6 ? '#b91c1c' : art.stock_actual < STOCK_MINIMO_ACEPTABLE ? '#b45309' : '#15803d';

                  return (
                    <tr key={art.id_articulo}>
                      <td><strong>#{art.id_articulo}</strong></td>
                      <td style={{ fontWeight: 500 }}>{art.nombre_articulo}</td>
                      <td>
                        <strong style={{ fontSize: '1rem', color: colorStock }}>
                          {art.stock_actual}
                        </strong> u.
                      </td>
                      <td>
                        {renderEstadoStock(art.stock_actual)}
                      </td>
                      <td>${Number(art.costo_unitario_actual).toLocaleString('es-CL')}</td>
                      <td>
                        {faltantes > 0 ? (
                          <div>
                            <strong style={{ color: art.stock_actual <= 6 ? '#b91c1c' : '#b45309' }}>
                              Faltan {faltantes} unidades.
                            </strong>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-600)', marginTop: '2px' }}>
                              ${costoFaltante.toLocaleString('es-CL')} estimado
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: 500 }}>
                            Completo
                          </span>
                        )}
                      </td>
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
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-ink-400)', padding: 'var(--space-6)' }}>
                  No hay movimientos registrados en el kardex aún.
                </td>
              </tr>
            ) : (
              movimientos.map((m) => (
                <tr key={m.id_movimiento}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(m.fecha_movimiento).toLocaleString('es-CL')}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {m.articulo?.nombre_articulo ?? `Artículo #${m.id_articulo}`}
                  </td>
                  <td>
                    <span className={`inventario-badge ${m.tipo_movimiento === 'entrada' ? 'is-entrada' : 'is-salida'}`}>
                      {m.tipo_movimiento === 'entrada' ? '↓ Entrada' : '↑ Salida (Consumo)'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: m.tipo_movimiento === 'entrada' ? '#15803d' : '#b91c1c' }}>
                      {m.tipo_movimiento === 'entrada' ? `+${m.cantidad}` : `-${m.cantidad}`}
                    </strong>
                  </td>
                  <td>{m.observacion || <span style={{ color: 'var(--color-ink-400)' }}>—</span>}</td>
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
            <p style={{ color: '#b91c1c', background: '#fee2e2', padding: '8px 12px', borderRadius: '4px', fontSize: '0.875rem', margin: '0 0 16px' }}>
              {errorModal}
            </p>
          )}

          <form onSubmit={handleGuardarEntrada} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-ink-900)' }}>
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
                required
              >
                <option value="" disabled>Selecciona un artículo...</option>
                {articulos.map((art) => (
                  <option key={art.id_articulo} value={art.id_articulo}>
                    {art.nombre_articulo} (Stock actual: {art.stock_actual})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-ink-900)' }}>
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
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-ink-900)' }}>
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

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
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
    </div>
  );
}
