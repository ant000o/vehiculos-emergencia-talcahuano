import React, { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { listarUsuarios } from '../services/usuario.service';
import { Usuario } from '../types/auth';

export default function UsuariosListScreen({ navigation }: any) {
  const { usuario: usuarioSesion } = useAuth();
  const esAdmin = usuarioSesion?.rol === 'administrador';

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Boton "+ Nuevo" en el header, con fondo rojo, solo visible para administrador.
  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        esAdmin ? (
          <TouchableOpacity
            style={styles.headerBoton}
            onPress={() => navigation.navigate('UsuarioForm', { usuario: null })}
          >
            <Text style={styles.headerBotonTexto}>+ Nuevo</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [esAdmin]);

  async function cargarUsuarios() {
    try {
      const data = await listarUsuarios();
      setUsuarios(data);
      setError(null);
    } catch (err) {
      setError('No se pudo cargar el listado de usuarios.');
    }
  }

  // useFocusEffect (no useEffect) para que la lista se refresque
  // automaticamente al volver desde crear/editar un usuario.
  useFocusEffect(
    useCallback(() => {
      setCargando(true);
      cargarUsuarios().finally(() => setCargando(false));
    }, []),
  );

  async function onRefresh() {
    setRefrescando(true);
    await cargarUsuarios();
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
    // edges={['bottom']}: el header ya maneja el "top" (notch/isla dinamica),
    // solo falta proteger la barra de gestos/home indicator de abajo.
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={usuarios}
        keyExtractor={(item) => String(item.id_usuario)}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
        contentContainerStyle={usuarios.length === 0 && styles.listaVacia}
        ListEmptyComponent={<Text style={styles.vacioTexto}>No hay usuarios registrados.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            disabled={!esAdmin}
            onPress={() => esAdmin && navigation.navigate('UsuarioForm', { usuario: item })}
          >
            <View style={styles.cardInfo}>
              <Text style={styles.nombre}>
                {item.nombre} {item.apellidos}
              </Text>
              <Text style={styles.detalle}>{item.rol.nombre_rol} — {item.compania.nombre}</Text>
              <Text style={styles.detalle}>{item.email}</Text>
            </View>
            <View style={[styles.badge, item.estado_activo ? styles.badgeActivo : styles.badgeInactivo]}>
              <Text style={styles.badgeTexto}>{item.estado_activo ? 'Activo' : 'Deshabilitado'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: '#B91C1C', textAlign: 'center', padding: 12 },
  listaVacia: { flex: 1, justifyContent: 'center' },
  vacioTexto: { textAlign: 'center', color: '#666' },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cardInfo: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: '600' },
  detalle: { fontSize: 13, color: '#666', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  badgeActivo: { backgroundColor: '#DCFCE7' },
  badgeInactivo: { backgroundColor: '#FEE2E2' },
  badgeTexto: { fontSize: 12, fontWeight: '600' },
  headerBoton: {
    backgroundColor: '#B91C1C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 4,
  },
  headerBotonTexto: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
