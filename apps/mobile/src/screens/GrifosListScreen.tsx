import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { listarGrifos } from '../services/grifo.service';
import { Grifo, EstadoGrifo } from '../types/grifo';
import { distanciaEnMetros, formatearDistancia } from '../utils/distancia';

const ESTADO_LABEL: Record<EstadoGrifo, string> = {
  [EstadoGrifo.OPERATIVO]: 'Operativo',
  [EstadoGrifo.EN_MANTENCION]: 'En mantención',
  [EstadoGrifo.FUERA_DE_SERVICIO]: 'Fuera de servicio',
};

const ESTADO_COLOR: Record<EstadoGrifo, { bg: string; texto: string }> = {
  [EstadoGrifo.OPERATIVO]: { bg: '#DCFCE7', texto: '#166534' },
  [EstadoGrifo.EN_MANTENCION]: { bg: '#FEF9C3', texto: '#854D0E' },
  [EstadoGrifo.FUERA_DE_SERVICIO]: { bg: '#FEE2E2', texto: '#991B1B' },
};

interface GrifoConDistancia extends Grifo {
  distanciaMetros: number | null;
}

export default function GrifosListScreen({ navigation }: any) {
  const [grifos, setGrifos] = useState<GrifoConDistancia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoUbicacion, setAvisoUbicacion] = useState<string | null>(null);

  async function cargarGrifos() {
    try {
      const data = await listarGrifos();

      // Pide permiso de ubicación cada vez -- si ya fue concedido antes,
      // el sistema operativo no vuelve a preguntar, solo lo confirma.
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setAvisoUbicacion('Sin acceso a tu ubicación: la lista no está ordenada por cercanía.');
        setGrifos(data.map((g) => ({ ...g, distanciaMetros: null })));
        setError(null);
        return;
      }

      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const origen: [number, number] = [posicion.coords.latitude, posicion.coords.longitude];

      const conDistancia = data.map((g) => ({
        ...g,
        distanciaMetros: g.coordenadas
          ? distanciaEnMetros(origen, g.coordenadas.coordinates)
          : null,
      }));

      conDistancia.sort((a, b) => (a.distanciaMetros ?? Infinity) - (b.distanciaMetros ?? Infinity));

      setAvisoUbicacion(null);
      setGrifos(conDistancia);
      setError(null);
    } catch {
      setError('No se pudo cargar el listado de grifos.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      setCargando(true);
      cargarGrifos().finally(() => setCargando(false));
    }, []),
  );

  async function onRefresh() {
    setRefrescando(true);
    await cargarGrifos();
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
      {error && <Text style={styles.error}>{error}</Text>}
      {avisoUbicacion && <Text style={styles.aviso}>{avisoUbicacion}</Text>}

      <FlatList
        data={grifos}
        keyExtractor={(item) => String(item.id_grifo)}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
        contentContainerStyle={[styles.listaContenido, grifos.length === 0 && styles.listaVacia]}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListEmptyComponent={<Text style={styles.vacioTexto}>No hay grifos registrados.</Text>}
        renderItem={({ item }) => {
          const colores = ESTADO_COLOR[item.estado_operativo];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.6}
              onPress={() => navigation.navigate('GrifoDetalle', { grifo: item })}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.direccion}>{item.direccion ?? `Grifo #${item.id_grifo}`}</Text>
                <Text style={styles.detalle}>
                  {item.compania.nombre}
                  {item.distanciaMetros !== null ? ` — ${formatearDistancia(item.distanciaMetros)}` : ''}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colores.bg }]}>
                <Text style={[styles.badgeTexto, { color: colores.texto }]}>
                  {ESTADO_LABEL[item.estado_operativo]}
                </Text>
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
  aviso: { color: '#854D0E', backgroundColor: '#FEF9C3', textAlign: 'center', padding: 8, fontSize: 12 },
  listaContenido: { padding: 12 },
  listaVacia: { flex: 1, justifyContent: 'center' },
  vacioTexto: { textAlign: 'center', color: '#666' },
  separador: { height: 10 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardInfo: { flex: 1, paddingRight: 10 },
  direccion: { fontSize: 16, fontWeight: '700', color: '#111827' },
  detalle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  badgeTexto: { fontSize: 12, fontWeight: '700' },
});
