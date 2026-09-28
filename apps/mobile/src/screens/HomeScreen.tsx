import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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
    disponible: false, // próxima HU a construir
  },
  {
    titulo: 'Grifos',
    descripcion: 'Marcar estado de disponibilidad',
    emoji: '💧',
    ruta: 'GrifosList',
    disponible: false, // próxima HU a construir
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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

        <TouchableOpacity style={styles.botonSecundario} onPress={logout}>
          <Text style={styles.botonSecundarioTexto}>Cerrar sesión</Text>
        </TouchableOpacity>
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
  botonSecundario: {
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  botonSecundarioTexto: { color: '#B91C1C', fontWeight: '600' },
});
