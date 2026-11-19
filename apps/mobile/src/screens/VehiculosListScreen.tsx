import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { listarVehiculos } from '../services/vehiculo.service';
import { obtenerUltimosRegistrosPorVehiculo } from '../services/registroOperatividad.service';
import { Vehiculo, EstadoVehiculo } from '../types/vehiculo';
import { RegistroOperatividad } from '../types/registroOperatividad';

const IMAGEN_REFERENCIAL = require('../../assets/carro-bomba.png');

const PUNTO_ESTADO: Record<EstadoVehiculo, string> = {
  [EstadoVehiculo.OPERATIVO]: '#15803D',
  [EstadoVehiculo.EN_MANTENCION]: '#D97706',
  [EstadoVehiculo.FUERA_DE_SERVICIO]: '#B91C1C',
};

function Dato({ etiqueta, valor, alerta }: { etiqueta: string; valor: string; alerta?: boolean }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={[styles.datoValor, alerta && { color: '#B91C1C' }]}>{valor}</Text>
    </View>
  );
}

const ESTADO_LABEL: Record<EstadoVehiculo, string> = {
  [EstadoVehiculo.OPERATIVO]: 'Operativo',
  [EstadoVehiculo.EN_MANTENCION]: 'En mantención',
  [EstadoVehiculo.FUERA_DE_SERVICIO]: 'Fuera de servicio',
};

const ESTADO_COLOR: Record<EstadoVehiculo, { bg: string; texto: string }> = {
  [EstadoVehiculo.OPERATIVO]: { bg: '#DCFCE7', texto: '#166534' },
  [EstadoVehiculo.EN_MANTENCION]: { bg: '#FEF9C3', texto: '#854D0E' },
  [EstadoVehiculo.FUERA_DE_SERVICIO]: { bg: '#FEE2E2', texto: '#991B1B' },
};

// Mismo criterio de color que en el detalle del vehículo.
function colorNivel(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '#D1D5DB'; // gris: sin datos
  if (valor < 20) return '#DC2626';
  if (valor < 50) return '#D97706';
  return '#16A34A';
}

function PuntosNiveles({ registro }: { registro: RegistroOperatividad | undefined }) {
  return (
    <View style={styles.puntosFila}>
      <View style={[styles.punto, { backgroundColor: colorNivel(registro?.nivel_combustible) }]} />
      <View style={[styles.punto, { backgroundColor: colorNivel(registro?.nivel_agua) }]} />
      <View style={[styles.punto, { backgroundColor: colorNivel(registro?.nivel_aceite) }]} />
    </View>
  );
}

export default function VehiculosListScreen({ navigation }: any) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [ultimosRegistros, setUltimosRegistros] = useState<Map<number, RegistroOperatividad>>(
    new Map(),
  );
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const busquedaRef = useRef('');
  const primeraVez = useRef(true);

  async function cargarVehiculos() {
    try {
      const [vehiculosData, registrosMap] = await Promise.all([
        listarVehiculos(busquedaRef.current),
        obtenerUltimosRegistrosPorVehiculo(),
      ]);
      setVehiculos(vehiculosData);
      setUltimosRegistros(registrosMap);
      setError(null);
    } catch {
      setError('No se pudo cargar el listado de vehículos.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      setCargando(true);
      cargarVehiculos().finally(() => setCargando(false));
    }, []),
  );

  // Búsqueda por patente (también marca y modelo) en el backend, con pausa
  // de 400 ms al escribir para no llamar a la API en cada letra.
  useEffect(() => {
    busquedaRef.current = busqueda;
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    const t = setTimeout(() => {
      cargarVehiculos();
    }, 400);
    return () => clearTimeout(t);
  }, [busqueda]);

  async function onRefresh() {
    setRefrescando(true);
    await cargarVehiculos();
    setRefrescando(false);
  }

  if (cargando) {
    return (
      <SafeAreaView style={styles.centro} edges={['bottom']}>
        <ActivityIndicator size="large" color="#B91C1C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.busquedaCaja}>
        <TextInput
          style={styles.busqueda}
          placeholder="Buscar por patente, marca o modelo"
          placeholderTextColor="#9CA3AF"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={vehiculos}
        keyExtractor={(item) => String(item.id_vehiculo)}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
        contentContainerStyle={[
          styles.listaContenido,
          vehiculos.length === 0 && styles.listaVacia,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListEmptyComponent={<Text style={styles.vacioTexto}>
            {busqueda.trim()
              ? `Sin resultados para "${busqueda.trim()}".`
              : 'No hay vehículos registrados.'}
          </Text>}
        renderItem={({ item }) => {
          const km = Number(item.kilometraje ?? 0);
          const proxKm = item.proxima_mantencion ?? km + 10000;
          const vencida = item.proxima_mantencion != null && km >= item.proxima_mantencion;
          const fueraServicio = item.estado_operativo === EstadoVehiculo.FUERA_DE_SERVICIO;
          return (
            <TouchableOpacity
              style={[styles.card, fueraServicio && styles.cardFuera]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('VehiculoDetalle', { vehiculo: item })}
            >
              <View style={styles.media}>
                <Image
                  source={item.imagen_url ? { uri: item.imagen_url } : IMAGEN_REFERENCIAL}
                  style={styles.imagen}
                  resizeMode="cover"
                />
                <View style={styles.estadoPildora}>
                  <View style={[styles.estadoPunto, { backgroundColor: PUNTO_ESTADO[item.estado_operativo] }]} />
                  <Text style={styles.estadoTexto}>{ESTADO_LABEL[item.estado_operativo]}</Text>
                </View>
              </View>

              <View style={styles.cuerpo}>
                <View style={styles.titulo}>
                  <Text style={styles.patente}>{item.patente}</Text>
                  <Text style={styles.modelo} numberOfLines={2}>
                    {item.marca} {item.modelo}
                  </Text>
                </View>

                <View style={styles.datos}>
                  <Dato etiqueta="Año" valor={String(item.anio)} />
                  <Dato etiqueta="Kilometraje" valor={`${km.toLocaleString('es-CL')} km`} />
                  <Dato
                    etiqueta="Próx. mantención"
                    valor={`${Number(proxKm).toLocaleString('es-CL')} km`}
                    alerta={vencida}
                  />
                  <Dato etiqueta="Compañía" valor={item.compania.nombre} />
                </View>

                <View style={styles.niveles}>
                  <Text style={styles.nivelesEtiqueta}>Combustible · Agua · Aceite</Text>
                  <PuntosNiveles registro={ultimosRegistros.get(item.id_vehiculo)} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#B91C1C', textAlign: 'center', padding: 12 },
  busquedaCaja: { paddingHorizontal: 12, paddingTop: 12 },
  busqueda: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  listaContenido: { padding: 12 },
  listaVacia: { flex: 1, justifyContent: 'center' },
  vacioTexto: { textAlign: 'center', color: '#666' },
  separador: { height: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardFuera: { borderTopWidth: 4, borderTopColor: '#B91C1C' },
  media: { height: 150, backgroundColor: '#0F1F38' },
  imagen: { width: '100%', height: '100%' },
  estadoPildora: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  estadoPunto: { width: 8, height: 8, borderRadius: 4 },
  estadoTexto: { fontSize: 11, fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: 0.4 },
  cuerpo: { padding: 18 },
  titulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  patente: { fontSize: 26, fontWeight: '900', color: '#9F1B1B', letterSpacing: 0.5 },
  modelo: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
    textTransform: 'uppercase',
    marginTop: 8,
  },
  datos: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  dato: { width: '50%', marginBottom: 12, paddingRight: 8 },
  datoEtiqueta: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  datoValor: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 2 },
  niveles: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nivelesEtiqueta: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  puntosFila: { flexDirection: 'row', gap: 6 },
  punto: { width: 10, height: 10, borderRadius: 5 },
});
