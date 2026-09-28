import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { listarArticulos, agregarRepuestoAMantencion } from '../services/inventario.service';
import { ArticuloInventario, Mantencion } from '../types/mantencion';

export default function RepuestoFormScreen({ route, navigation }: any) {
  const mantencion: Mantencion = route.params.mantencion;

  const [articulos, setArticulos] = useState<ArticuloInventario[]>([]);
  const [idArticulo, setIdArticulo] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState('1');

  const [cargandoArticulos, setCargandoArticulos] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        const data = await listarArticulos();
        setArticulos(data);
        if (data[0]) setIdArticulo(data[0].id_articulo);
      } catch {
        setError('No se pudo cargar el listado de artículos de inventario.');
      } finally {
        setCargandoArticulos(false);
      }
    }
    cargar();
  }, []);

  const articuloSeleccionado = articulos.find((a) => a.id_articulo === idArticulo) ?? null;
  const cantidadNumerica = Number(cantidad);
  const stockInsuficiente =
    articuloSeleccionado !== null &&
    !Number.isNaN(cantidadNumerica) &&
    cantidadNumerica > articuloSeleccionado.stock_actual;

  function validar(): string | null {
    if (!idArticulo) return 'Selecciona un artículo.';
    if (!cantidad.trim() || Number.isNaN(cantidadNumerica) || cantidadNumerica < 1) {
      return 'La cantidad debe ser un número entero mayor a 0.';
    }
    if (stockInsuficiente) {
      return `Stock insuficiente: quedan ${articuloSeleccionado?.stock_actual} unidad(es).`;
    }
    return null;
  }

  async function handleGuardar() {
    const mensajeValidacion = validar();
    if (mensajeValidacion) {
      setError(mensajeValidacion);
      return;
    }

    setError(null);
    setGuardando(true);
    try {
      await agregarRepuestoAMantencion({
        id_mantencion: mantencion.id_mantencion,
        id_articulo: idArticulo!,
        cantidad: cantidadNumerica,
      });
      navigation.goBack();
    } catch (err: any) {
      const mensaje = err?.response?.data?.message ?? 'No se pudo registrar el repuesto.';
      setError(Array.isArray(mensaje) ? mensaje.join('\n') : mensaje);
    } finally {
      setGuardando(false);
    }
  }

  if (cargandoArticulos) {
    return (
      <SafeAreaView style={styles.centro} edges={['bottom']}>
        <ActivityIndicator size="large" color="#B91C1C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        {error && <Text style={styles.error}>{error}</Text>}

        {articulos.length === 0 ? (
          <Text style={styles.vacioTexto}>No hay artículos cargados en el inventario.</Text>
        ) : (
          <>
            <Text style={styles.label}>Artículo</Text>
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
                Stock disponible: {articuloSeleccionado.stock_actual} — Costo unitario: $
                {Number(articuloSeleccionado.costo_unitario_actual).toLocaleString('es-CL')}
              </Text>
            )}

            <Text style={styles.label}>Cantidad utilizada</Text>
            <TextInput
              style={styles.input}
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.boton, guardando && styles.botonDeshabilitado]}
              onPress={handleGuardar}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botonTexto}>Registrar repuesto</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  contenido: { padding: 20, paddingBottom: 40 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#B91C1C', marginBottom: 12, textAlign: 'center' },
  vacioTexto: { textAlign: 'center', color: '#666', marginTop: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 4 },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  stockInfo: { fontSize: 12, color: '#666', marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  boton: {
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
