import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { listarMantenciones, type Mantencion } from '../../services/mantenciones';
import {
  listarArticulos,
  listarDetallesMantencion,
  descontarRepuesto,
  type ArticuloInventario,
  type DetalleArticuloMantencion,
} from '../../services/inventario';

// Solo tiene sentido agregar repuestos a mantenciones que siguen abiertas.
const ESTADOS_ABIERTOS = new Set(['pendiente', 'en_proceso']);

export function DescontarRepuestoForm() {
  const [mantenciones, setMantenciones] = useState<Mantencion[]>([]);
  const [articulos, setArticulos] = useState<ArticuloInventario[]>([]);
  const [detalles, setDetalles] = useState<DetalleArticuloMantencion[]>([]);

  const [idMantencion, setIdMantencion] = useState<number | null>(null);
  const [idArticulo, setIdArticulo] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      const [listaMantenciones, listaArticulos, listaDetalles] = await Promise.all([
        listarMantenciones(),
        listarArticulos(),
        listarDetallesMantencion(),
      ]);
      const abiertas = listaMantenciones.filter((m) => ESTADOS_ABIERTOS.has(m.estado_mantencion));
      setMantenciones(abiertas);
      setArticulos(listaArticulos);
      setDetalles(listaDetalles);
      setIdMantencion(abiertas[0]?.id_mantencion ?? null);
      setIdArticulo(listaArticulos[0]?.id_articulo ?? null);
      setIsLoading(false);
    }
    cargar();
  }, []);

  const articuloSeleccionado = articulos.find((a) => a.id_articulo === idArticulo);

  // Repuestos ya descontados para la mantención elegida, y el total que
  // suman — esto es lo que la HU pide como "recalcular el costo total".
  const detallesDeLaMantencion = useMemo(
    () => detalles.filter((d) => d.id_mantencion === idMantencion),
    [detalles, idMantencion],
  );

  const totalRepuestos = detallesDeLaMantencion.reduce(
    (acc, d) => acc + d.cantidad * Number(d.costo_unitario_historico),
    0,
  );

  const mantencionSeleccionada = mantenciones.find((m) => m.id_mantencion === idMantencion);
  const costoManoObra = mantencionSeleccionada ? Number(mantencionSeleccionada.costo_mano_obra) : 0;
  const costoTotalReparacion = costoManoObra + totalRepuestos;

  function validar(): string | null {
    if (!idMantencion) return 'Selecciona una mantención.';
    if (!idArticulo) return 'Selecciona un repuesto.';
    if (cantidad < 1) return 'La cantidad debe ser al menos 1.';
    if (articuloSeleccionado && cantidad > articuloSeleccionado.stock_actual) {
      return `Solo hay ${articuloSeleccionado.stock_actual} unidades en stock.`;
    }
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      return;
    }
    if (!idMantencion || !idArticulo) return;

    setIsSaving(true);
    setError(null);

    try {
      const nuevoDetalle = await descontarRepuesto({
        cantidad,
        id_mantencion: idMantencion,
        id_articulo: idArticulo,
        costo_unitario_historico: Number(articuloSeleccionado?.costo_unitario_actual ?? 0),
      });

      setDetalles((prev) => [...prev, nuevoDetalle]);
      // El stock cambió por el trigger de la BD — refrescamos para reflejarlo.
      const articulosActualizados = await listarArticulos();
      setArticulos(articulosActualizados);
      setCantidad(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descontar el repuesto.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p>Cargando datos…</p>;
  }

  return (
    <div>
      <p className="mantenciones-page__subtitle">
        Descuenta repuestos usados en una mantención abierta. El stock se resta
        automáticamente en la base de datos al guardar.
      </p>

      {error && (
        <p className="mantenciones-page__alert" role="alert">
          {error}
        </p>
      )}

      {mantenciones.length === 0 ? (
        <p className="mantenciones-page__empty">
          No hay mantenciones abiertas (pendientes o en proceso) en este momento.
        </p>
      ) : (
        <>
          <form className="mantenciones-form" onSubmit={handleSubmit} noValidate>
            <div className="mantenciones-form__field">
              <label htmlFor="mantencion">Mantención</label>
              <select
                id="mantencion"
                value={idMantencion ?? ''}
                onChange={(e) => setIdMantencion(Number(e.target.value))}
              >
                {mantenciones.map((m) => (
                  <option key={m.id_mantencion} value={m.id_mantencion}>
                    #{m.id_mantencion} — {m.vehiculo?.patente ?? '—'} ({m.tipo_mantencion})
                  </option>
                ))}
              </select>
            </div>

            <div className="mantenciones-form__row">
              <div className="mantenciones-form__field">
                <label htmlFor="articulo">Repuesto</label>
                <select
                  id="articulo"
                  value={idArticulo ?? ''}
                  onChange={(e) => setIdArticulo(Number(e.target.value))}
                >
                  {articulos.map((a) => (
                    <option key={a.id_articulo} value={a.id_articulo}>
                      {a.nombre_articulo} (stock: {a.stock_actual})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mantenciones-form__field">
                <label htmlFor="cantidad">Cantidad</label>
                <input
                  id="cantidad"
                  type="number"
                  min={1}
                  max={articuloSeleccionado?.stock_actual}
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                />
              </div>
            </div>

            {articuloSeleccionado && (
              <p className="mantenciones-form__hint">
                Subtotal: {cantidad} × ${Number(articuloSeleccionado.costo_unitario_actual).toLocaleString('es-CL')} = $
                {(cantidad * Number(articuloSeleccionado.costo_unitario_actual)).toLocaleString('es-CL')}
              </p>
            )}

            <button type="submit" className="mantenciones-form__submit" disabled={isSaving}>
              {isSaving ? 'Descontando…' : 'Descontar repuesto'}
            </button>
          </form>

          <div className="repuestos-resumen">
            <h2 className="repuestos-resumen__title">
              Repuestos descontados en esta mantención
            </h2>
            {detallesDeLaMantencion.length === 0 ? (
              <p className="historial-table__empty">Todavía no se ha descontado ningún repuesto.</p>
            ) : (
              <table className="historial-table">
                <thead>
                  <tr>
                    <th>Repuesto</th>
                    <th>Cantidad</th>
                    <th>Costo unitario</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detallesDeLaMantencion.map((d) => (
                    <tr key={d.id_detalle}>
                      <td>{d.articulo?.nombre_articulo ?? `#${d.id_articulo}`}</td>
                      <td>{d.cantidad}</td>
                      <td>${Number(d.costo_unitario_historico).toLocaleString('es-CL')}</td>
                      <td>${(d.cantidad * Number(d.costo_unitario_historico)).toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <p className="repuestos-resumen__total">
              Mano de obra: ${costoManoObra.toLocaleString('es-CL')} + Repuestos: $
              {totalRepuestos.toLocaleString('es-CL')} = <strong>Total: $
              {costoTotalReparacion.toLocaleString('es-CL')}</strong>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
