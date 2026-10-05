import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { crearRegistroOperatividad } from '../services/registroOperatividad.service';
import { Vehiculo } from '../types/vehiculo';

function esNivelValido(texto: string): boolean {
  if (texto.trim() === '') return true;
  const n = Number(texto);
  return !Number.isNaN(n) && n >= 0 && n <= 100;
}

export default function RegistroOperatividadFormScreen({ route, navigation }: any) {
  const vehiculo: Vehiculo = route.params.vehiculo;
  const { usuario } = useAuth();

  const [nivelCombustible, setNivelCombustible] = useState('');
  const [nivelAgua, setNivelAgua] = useState('');
  const [nivelAceite, setNivelAceite] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    navigation.setOptions({ title: `Revisión — ${vehiculo.patente}` });
  }, []);

  function validar(): string | null {
    if (!esNivelValido(nivelCombustible)) return 'El nivel de combustible debe ser un número entre 0 y 100.';
    if (!esNivelValido(nivelAgua)) return 'El nivel de agua debe ser un número entre 0 y 100.';
    if (!esNivelValido(nivelAceite)) return 'El nivel de aceite debe ser un número entre 0 y 100.';
    if (
      nivelCombustible.trim() === '' &&
      nivelAgua.trim() === '' &&
      nivelAceite.trim() === '' &&
      observaciones.trim() === ''
    ) {
      return 'Ingresa al menos un dato de la revisión.';
    }
    return null;
  }

  async function handleGuardar() {
    const mensajeValidacion = validar();
    if (mensajeValidacion) {
      setError(mensajeValidacion);
      return;
    }

    if (!usuario?.id_usuario) {
      setError('No se pudo identificar al usuario de la sesión. Vuelve a iniciar sesión.');
      return;
    }

    setError(null);
    setGuardando(true);
    try {
      await crearRegistroOperatividad({
        id_vehiculo: vehiculo.id_vehiculo,
        id_usuario: usuario.id_usuario,
        ...(nivelCombustible.trim() !== '' && { nivel_combustible: Number(nivelCombustible) }),
        ...(nivelAgua.trim() !== '' && { nivel_agua: Number(nivelAgua) }),
        ...(nivelAceite.trim() !== '' && { nivel_aceite: Number(nivelAceite) }),
        ...(observaciones.trim() !== '' && { observaciones: observaciones.trim() }),
      });
      navigation.goBack();
    } catch (err: any) {
      const mensaje = err?.response?.data?.message ?? 'No se pudo guardar la revisión.';
      setError(Array.isArray(mensaje) ? mensaje.join('\n') : mensaje);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Niveles del vehículo</Text>

          <Text style={styles.label}>Nivel de combustible (%)</Text>
          <TextInput
            style={styles.input}
            value={nivelCombustible}
            onChangeText={setNivelCombustible}
            keyboardType="numeric"
            placeholder="0 - 100"
          />

          <Text style={styles.label}>Nivel de agua (%)</Text>
          <TextInput
            style={styles.input}
            value={nivelAgua}
            onChangeText={setNivelAgua}
            keyboardType="numeric"
            placeholder="0 - 100"
          />

          <Text style={styles.label}>Nivel de aceite (%)</Text>
          <TextInput
            style={styles.input}
            value={nivelAceite}
            onChangeText={setNivelAceite}
            keyboardType="numeric"
            placeholder="0 - 100"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Observaciones</Text>
          <TextInput
            style={[styles.input, styles.inputMultilinea]}
            value={observaciones}
            onChangeText={setObservaciones}
            multiline
            numberOfLines={4}
            placeholder="Detalles adicionales de la revisión (opcional)"
          />
        </View>

        <TouchableOpacity
          style={[styles.boton, guardando && styles.botonDeshabilitado]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Guardar revisión</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  contenido: { padding: 16, paddingBottom: 40 },
  error: { color: '#B91C1C', marginBottom: 12, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  inputMultilinea: { minHeight: 90, textAlignVertical: 'top' },
  boton: {
    backgroundColor: '#B91C1C',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
