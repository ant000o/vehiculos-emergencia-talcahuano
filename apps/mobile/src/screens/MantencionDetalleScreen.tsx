import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerMantencion } from '../services/mantencion.service';
import { listarArticulos, agregarRepuestoAMantencion } from '../services/inventario.service';
import { Mantencion, TipoMantencion, EstadoMantencion, ArticuloInventario } from '../types/mantencion';
import { Vehiculo } from '../types/vehiculo';

const TIPO_LABEL: Record<TipoMantencion, string> = {
  [TipoMantencion.PREVENTIVA]: 'Preventiva',
  [TipoMantencion.CORRECTIVA]: 'Correctiva (reactiva)',
  [TipoMantencion.REVISION]: 'Revisión',
};

const ESTADO_LABEL: Record<EstadoMantencion, string> = {
  [EstadoMantencion.PENDIENTE]: 'Pendiente',
  [EstadoMantencion.EN_PROCESO]: 'En proceso',
  [EstadoMantencion.FINALIZADA]: 'Finalizada',
  [EstadoMantencion.CANCELADA]: 'Cancelada',
};

export default function MantencionDetalleScreen({ route, navigation }: any) {
  const vehiculo: Vehiculo = route.params.vehiculo;
  const mantencionInicial: Mantencion = route.params.mantencion;

  const [mantencion, setMantencion] = useState<Mantencion>(mantencionInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Formulario de repuesto: siempre visible en esta pantalla ---
  const [articulos, setArticulos] = useState<ArticuloInventario[]>([]);
  const [cargandoArticulos, setCargandoArticulos] = useState(true);
  const [idArticulo, setIdArticulo] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState('1');
  const [guardandoRepuesto, setGuardandoRepuesto] = useState(false);
  const [errorRepuesto, setErrorRepuesto] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: TIPO_LABEL[mantencion.tipo_mantencion] });
  }, [mantencion]);

  useEffect(() => {
    async function cargarArticulos() {
      setCargandoArticulos(true);
      try {
        const data = await listarArticulos();
        setArticulos(data);
        if (data[0]) setIdArticulo(data[0].id_articulo);
      } catch {
        setErrorRepuesto('No se pudo cargar el listado de artículos.');
      } finally {
        setCargandoArticulos(false);
      }
    }
    cargarArticulos();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      setCargando(true);
      obtenerMantencion(mantencionInicial.id_mantencion)
        .then((data) => {
          if (activo) {
            setMantencion(data);
            setError(null);
          }
        })
        .catch(() => {
          if (activo) setError('No se pudo actualizar el detalle de la mantención.');
        })
        .finally(() => {
          if (activo) setCargando(false);
        });
      return () => {
        activo = false;
      };
    }, [mantencionInicial.id_mantencion]),
  );

  const articuloSeleccionado = articulos.find((a) => a.id_articulo === idArticulo) ?? null;
  const cantidadNumerica = Number(cantidad);
  const stockInsuficiente =
    articuloSeleccionado !== null &&
    !Number.isNaN(cantidadNumerica) &&
    cantidadNumerica > articuloSeleccionado.stock_actual;

  async function handleGuardarRepuesto() {
    if (!idArticulo) {
      setErrorRepuesto('Selecciona un artículo.');
      return;
    }
    if (!cantidad.trim() || Number.isNaN(cantidadNumerica) || cantidadNumerica < 1) {
      setErrorRepuesto('La cantidad debe ser un número entero mayor a 0.');
      return;
    }
    if (stockInsuficiente) {
      setErrorRepuesto(`Stock insuficiente: quedan ${articuloSeleccionado?.stock_actual} unidad(es).`);
      return;
    }

    setErrorRepuesto(null);
    setGuardandoRepuesto(true);
    try {
      await agregarRepuestoAMantencion({
        id_mantencion: mantencion.id_mantencion,
        id_articulo: idArticulo,
        cantidad: cantidadNumerica,
      });
      const actualizada = await obtenerMantencion(mantencion.id_mantencion);
      setMantencion(actualizada);
      setCantidad('1');
    } catch (err: any) {
      const mensaje = err?.response?.data?.message ?? 'No se pudo registrar el repuesto.';
      setErrorRepuesto(Array.isArray(mensaje) ? mensaje.join('\n') : mensaje);
    } finally {
      setGuardandoRepuesto(false);
    }
  }

  const costoRepuestos = (mantencion.detalles_articulos ?? []).reduce(
    (total, d) => total + d.cantidad * Number(d.costo_unitario_historico),
    0,
  );
  const costoTotal = costoRepuestos + Number(mantencion.costo_mano_obra ?? 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        style={styles.container}
        data={mantencion.detalles_articulos ?? []}
        keyExtractor={(item) => String(item.id_detalle)}
        ListHeaderComponent={
          <>
            <View style={styles.card}>
              <Text style={styles.estado}>{ESTADO_LABEL[mantencion.estado_mantencion]}</Text>
              <Text style={styles.fecha}>
                Ingreso: {new Date(mantencion.fecha_ingreso).toLocaleDateString('es-CL')}
              </Text>
              {mantencion.descripcion_falla ? (
                <Text style={styles.descripcion}>{mantencion.descripcion_falla}</Text>
              ) : null}
              {mantencion.usuarioMecanico ? (
                <Text style={styles.mecanico}>
                  Mecánico: {mantencion.usuarioMecanico.nombre} {mantencion.usuarioMecanico.apellidos}
                </Text>
              ) : mantencion.taller_externo ? (
                <Text style={styles.mecanico}>Taller externo: {mantencion.taller_externo}</Text>
              ) : null}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Agregar repuesto</Text>
              {errorRepuesto && <Text style={styles.error}>{errorRepuesto}</Text>}

              {cargandoArticulos ? (
                <ActivityIndicator color="#B91C1C" style={{ marginVertical: 8 }} />
              ) : articulos.length === 0 ? (
                <Text style={styles.avisoTexto}>No hay artículos cargados en el inventario.</Text>
              ) : (
                <>
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={idArticulo} onValueChange={(v) => setIdArticulo(v)}>
                      {articulos.map((a) => (
                        <Picker.Item
                          key={a.id_articulo}
                          label={`${a.nombre_articulo} (stock: ${a.stock_actual})`}
                          value={a.id_articulo}
                        />
                      ))}
                    </Picker>
                  </View>

                  {articuloSeleccionado && (
                    <Text style={styles.stockInfo}>
                      Costo unitario: $
                      {Number(articuloSeleccionado.costo_unitario_actual).toLocaleString('es-CL')}
                    </Text>
                  )}

                  <View style={styles.filaCantidad}>
                    <Text style={styles.cantidadLabel}>Cantidad</Text>
                    <TextInput
                      style={styles.inputCantidad}
                      value={cantidad}
                      onChangeText={setCantidad}
                      keyboardType="numeric"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.botonGuardarRepuesto, guardandoRepuesto && styles.botonDeshabilitado]}
                    onPress={handleGuardarRepuesto}
                    disabled={guardandoRepuesto}
                  >
                    {guardandoRepuesto ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.botonTexto}>Guardar repuesto</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>

            <Text style={styles.seccionTitulo}>Repuestos utilizados</Text>
          </>
        }
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator color="#B91C1C" style={{ marginTop: 12 }} />
          ) : (
            <Text style={styles.vacioTexto}>Aún no se han registrado repuestos.</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.repuestoCard}>
            <View style={styles.repuestoInfo}>
              <Text style={styles.repuestoNombre}>{item.articulo.nombre_articulo}</Text>
              <Text style={styles.repuestoDetalle}>
                {item.cantidad} × ${Number(item.costo_unitario_historico).toLocaleString('es-CL')}
              </Text>
            </View>
            <Text style={styles.repuestoSubtotal}>
              ${(item.cantidad * Number(item.costo_unitario_historico)).toLocaleString('es-CL')}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerLabel}>Costo total (mano de obra + repuestos)</Text>
            <Text style={styles.footerTotal}>${costoTotal.toLocaleString('es-CL')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  estado: { fontSize: 13, fontWeight: '700', color: '#B91C1C' },
  fecha: { fontSize: 13, color: '#666', marginTop: 4 },
  descripcion: { fontSize: 14, color: '#333', marginTop: 8 },
  mecanico: { fontSize: 13, color: '#666', marginTop: 6 },
  error: { color: '#B91C1C', textAlign: 'center', padding: 8 },
  avisoTexto: { fontSize: 13, color: '#666' },
  pickerWrapper: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: '#fff' },
  stockInfo: { fontSize: 12, color: '#666', marginTop: 8 },
  filaCantidad: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  cantidadLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginRight: 12 },
  inputCantidad: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  botonGuardarRepuesto: {
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
  seccionTitulo: { fontSize: 14, fontWeight: '700', color: '#111827', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  vacioTexto: { textAlign: 'center', color: '#666', paddingVertical: 16 },
  repuestoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  repuestoInfo: { flex: 1 },
  repuestoNombre: { fontSize: 14, fontWeight: '600' },
  repuestoDetalle: { fontSize: 12, color: '#666', marginTop: 2 },
  repuestoSubtotal: { fontSize: 14, fontWeight: '700' },
  footer: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: { fontSize: 13, color: '#666', flex: 1 },
  footerTotal: { fontSize: 18, fontWeight: '800' },
});
