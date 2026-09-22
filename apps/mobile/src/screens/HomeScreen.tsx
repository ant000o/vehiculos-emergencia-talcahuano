import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { usuario, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.saludo}>Hola, {usuario?.nombre}</Text>
      <Text style={styles.detalle}>{usuario?.rol} — {usuario?.compania}</Text>

      <TouchableOpacity style={styles.boton} onPress={logout}>
        <Text style={styles.botonTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  saludo: { fontSize: 22, fontWeight: 'bold' },
  detalle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 32 },
  boton: { backgroundColor: '#B91C1C', borderRadius: 8, padding: 12, paddingHorizontal: 24 },
  botonTexto: { color: '#fff', fontWeight: '600' },
});