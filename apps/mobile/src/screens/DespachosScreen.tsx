import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { listarDespachosEnCurso } from '../services/despacho.service';
import { DespachoEmergencia } from '../types/despacho';
import DespachoCard from '../components/DespachoCard';
import { esMecanico } from '../utils/roles';

export default function DespachosScreen() {
  const { usuario } = useAuth();
  const { suscribir } = useRealtime();
  const [despachos, setDespachos] = useState<DespachoEmergencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sinAcceso = esMecanico(usuario?.rol);

  async function cargar() {
    try {
      setDespachos(await listarDespachosEnCurso());
      setError(null);
    } catch {
      setError('No se pudieron cargar los despachos.');
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (sinAcceso) {
        setCargando(false);
        return;
      }
      setCargando(true);
      cargar().finally(() => setCargando(false));
    }, [sinAcceso]),
  );

  // Cuando llega un despacho nuevo por WebSocket, se recarga la lista.
  useEffect(() => {
    if (sinAcceso) return;
    return suscribir('nuevo_despacho', () => {
      cargar();
    });
  }, [suscribir, sinAcceso]);

  async function onRefresh() {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }

  if (sinAcceso) {
    return (
      <SafeAreaView style={styles.centro} edges={['bottom']}>
        <Text style={styles.vacioTexto}>Tu perfil no tiene acceso a los despachos.</Text>
      </SafeAreaView>
    );
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
        data={despachos}
        keyExtractor={(d) => String(d.id_despacho)}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
        contentContainerStyle={[styles.lista, despachos.length === 0 && styles.listaVacia]}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          <Text style={styles.vacioTexto}>No hay despachos en curso. ✅</Text>
        }
        renderItem={({ item }) => <DespachoCard despacho={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  error: { color: '#B91C1C', textAlign: 'center', padding: 12 },
  lista: { padding: 14 },
  listaVacia: { flex: 1, justifyContent: 'center' },
  vacioTexto: { textAlign: 'center', color: '#6B7280', paddingHorizontal: 24 },
});
