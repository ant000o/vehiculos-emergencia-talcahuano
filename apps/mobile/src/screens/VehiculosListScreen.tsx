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
import { listarVehiculos } from '../services/vehiculo.service';
import { Vehiculo, EstadoVehiculo } from '../types/vehiculo';

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

export default function VehiculosListScreen({ navigation }: any) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargarVehiculos() {
    try {
      const data = await listarVehiculos();
      setVehiculos(data);
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
        ListEmptyComponent={<Text style={styles.vacioTexto}>No hay vehículos registrados.</Text>}
        renderItem={({ item }) => {
          const colores = ESTADO_COLOR[item.estado_operativo];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.6}
              onPress={() => navigation.navigate('VehiculoDetalle', { vehiculo: item })}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.patente}>{item.patente}</Text>
                <Text style={styles.detalle}>
                  {item.marca} {item.modelo} — {item.anio}
                </Text>
                <Text style={styles.compania}>{item.compania.nombre}</Text>
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
  patente: { fontSize: 20, fontWeight: '800', color: '#111827' },
  detalle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  compania: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  badgeTexto: { fontSize: 12, fontWeight: '700' },
});
