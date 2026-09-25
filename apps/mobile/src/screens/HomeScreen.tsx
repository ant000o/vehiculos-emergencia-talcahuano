import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }: any) {
  const { usuario, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.contenido}>
        <Text style={styles.saludo}>Hola, {usuario?.nombre}</Text>
        <Text style={styles.detalle}>{usuario?.rol} — {usuario?.compania}</Text>

        <TouchableOpacity style={styles.boton} onPress={() => navigation.navigate('UsuariosList')}>
          <Text style={styles.botonTexto}>Ver personal</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botonSecundario} onPress={logout}>
          <Text style={styles.botonSecundarioTexto}>Cerrar sesion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contenido: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  saludo: { fontSize: 22, fontWeight: 'bold' },
  detalle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 32 },
  boton: { backgroundColor: '#B91C1C', borderRadius: 8, padding: 12, paddingHorizontal: 32, marginBottom: 12 },
  botonTexto: { color: '#fff', fontWeight: '600' },
  botonSecundario: { borderWidth: 1, borderColor: '#B91C1C', borderRadius: 8, padding: 12, paddingHorizontal: 32 },
  botonSecundarioTexto: { color: '#B91C1C', fontWeight: '600' },
});
