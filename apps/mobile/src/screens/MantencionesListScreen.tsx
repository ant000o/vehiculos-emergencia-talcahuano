import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { listarMantencionesDeVehiculo } from '../services/mantencion.service';
import { Mantencion, EstadoMantencion, TipoMantencion } from '../types/mantencion';
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

const ESTADO_COLOR: Record<EstadoMantencion, { bg: string; texto: string }> = {
  [EstadoMantencion.PENDIENTE]: { bg: '#FEF9C3', texto: '#854D0E' },
  [EstadoMantencion.EN_PROCESO]: { bg: '#DBEAFE', texto: '#1E40AF' },
  [EstadoMantencion.FINALIZADA]: { bg: '#DCFCE7', texto: '#166534' },
  [EstadoMantencion.CANCELADA]: { bg: '#FEE2E2', texto: '#991B1B' },
};

export default function MantencionesListScreen({ route, navigation }: any) {
  const vehiculo: Vehiculo = route.params.vehiculo;

  const [mantenciones, setMantenciones] = useState<Mantencion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: `Mantenciones — ${vehiculo.patente}`,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerBoton}
          onPress={() => {
            navigation.navigate('MantencionForm', { vehiculo });
          }}
        >
          <Text style={styles.headerBotonTexto}>+ Nueva</Text>
        </TouchableOpacity>
      ),
    });
  }, []);

  async function cargarMantenciones() {
    try {
      const data = await listarMantencionesDeVehiculo(vehiculo.id_vehiculo);
      setMantenciones(data);
      setError(null);
    } catch {
      setError('No se pudo cargar el historial de mantenciones.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      setCargando(true);
      cargarMantenciones().finally(() => setCargando(false));
    }, []),
  );

  async function onRefresh() {
    setRefrescando(true);
    await cargarMantenciones();
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
        data={mantenciones}
        keyExtractor={(item) => String(item.id_mantencion)}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
        contentContainerStyle={mantenciones.length === 0 && styles.listaVacia}
        ListEmptyComponent={
          <Text style={styles.vacioTexto}>Este vehículo no tiene mantenciones registradas.</Text>
        }
        renderItem={({ item }) => {
          const colores = ESTADO_COLOR[item.estado_mantencion];
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('MantencionDetalle', { mantencion: item, vehiculo })}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.tipo}>{TIPO_LABEL[item.tipo_mantencion]}</Text>
                <Text style={styles.detalle}>
                  {new Date(item.fecha_ingreso).toLocaleDateString('es-CL')}
                  {item.usuarioMecanico
                    ? ` — ${item.usuarioMecanico.nombre} ${item.usuarioMecanico.apellidos}`
                    : item.taller_externo
                      ? ` — ${item.taller_externo}`
                      : ''}
                </Text>
                {item.descripcion_falla ? (
                  <Text style={styles.descripcion} numberOfLines={1}>
                    {item.descripcion_falla}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.badge, { backgroundColor: colores.bg }]}>
                <Text style={[styles.badgeTexto, { color: colores.texto }]}>
                  {ESTADO_LABEL[item.estado_mantencion]}
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
  container: { flex: 1, backgroundColor: '#fff' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#B91C1C', textAlign: 'center', padding: 12 },
  listaVacia: { flex: 1, justifyContent: 'center' },
  vacioTexto: { textAlign: 'center', color: '#666', paddingHorizontal: 24 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cardInfo: { flex: 1, paddingRight: 8 },
  tipo: { fontSize: 16, fontWeight: '700' },
  detalle: { fontSize: 13, color: '#666', marginTop: 2 },
  descripcion: { fontSize: 12, color: '#999', marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTexto: { fontSize: 11, fontWeight: '600' },
  headerBoton: {
    backgroundColor: '#B91C1C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 4,
  },
  headerBotonTexto: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
