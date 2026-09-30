import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

interface CardDef {
  titulo: string;
  descripcion: string;
  emoji: string;
  ruta: string;
  disponible: boolean;
}

const CARDS: CardDef[] = [
  {
    titulo: 'Vehículos',
    descripcion: 'Estado operativo y revisión diaria',
    emoji: '🚒',
    ruta: 'VehiculosList',
    disponible: true,
  },
  {
    titulo: 'Mantenciones',
    descripcion: 'Historial y registro de mantenciones',
    emoji: '🔧',
    ruta: 'MantencionesList',
    disponible: false,
  },
  {
    titulo: 'Grifos',
    descripcion: 'Marcar estado de disponibilidad',
    emoji: '💧',
    ruta: 'GrifosList',
    disponible: true,
  },
  {
    titulo: 'Personal',
    descripcion: 'Ver y gestionar cuentas de usuario',
    emoji: '👥',
    ruta: 'UsuariosList',
    disponible: true,
  },
];

export default function HomeScreen({ navigation }: any) {
  const { usuario, logout } = useAuth();

  function abrirMenu() {
    Alert.alert('Cuenta', undefined, [
      { text: 'Mi perfil (próximamente)', onPress: () => {} },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'SIGEV',
      headerStyle: { backgroundColor: '#fff' },
      headerShadowVisible: false,
      headerTitleStyle: { color: '#B91C1C', fontWeight: '800' },
      headerRight: () => (
        <TouchableOpacity style={styles.menuBoton} onPress={abrirMenu}>
          <Text style={styles.menuTexto}>⋮</Text>
        </TouchableOpacity>
      ),
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.saludo}>Hola, {usuario?.nombre}</Text>
        <Text style={styles.detalle}>
          {usuario?.rol} — {usuario?.compania}
        </Text>

        <View style={styles.grid}>
          {CARDS.map((card) => (
            <TouchableOpacity
              key={card.titulo}
              style={[styles.card, !card.disponible && styles.cardDeshabilitada]}
              disabled={!card.disponible}
              onPress={() => navigation.navigate(card.ruta)}
            >
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
              <Text style={styles.cardTitulo}>{card.titulo}</Text>
              <Text style={styles.cardDescripcion}>{card.descripcion}</Text>
              {!card.disponible && <Text style={styles.cardProximamente}>Próximamente</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  contenido: { padding: 20, paddingBottom: 40 },
  saludo: { fontSize: 22, fontWeight: 'bold' },
  detalle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardDeshabilitada: { opacity: 0.5 },
  cardEmoji: { fontSize: 28, marginBottom: 8 },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  cardDescripcion: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  cardProximamente: { fontSize: 11, color: '#B91C1C', fontWeight: '600', marginTop: 8 },
  menuBoton: { paddingHorizontal: 12, paddingVertical: 4 },
  menuTexto: { fontSize: 24, fontWeight: '900', color: '#B91C1C' },
});
