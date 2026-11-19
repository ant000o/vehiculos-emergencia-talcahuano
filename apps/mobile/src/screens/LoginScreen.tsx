import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import LogoSigev from '../components/LogoSigev';

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);

  async function handleLogin() {
    setError(null);

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }

    setCargando(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const mensaje = err?.response?.data?.message ?? 'No se pudo iniciar sesión. Intenta de nuevo.';
      setError(Array.isArray(mensaje) ? mensaje[0] : mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.raiz}>
      <SafeAreaView edges={['top']} style={styles.zonaRoja}>
        <View style={styles.cabecera}>
          <LogoSigev size={150} />
          <Text style={styles.titulo}>SIGEV</Text>
          <Text style={styles.subtitulo}>Bomberos de Talcahuano</Text>
          <Text style={styles.descripcion}>
            Control y seguimiento de mantención de vehículos de emergencia
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.tarjeta}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.formulario, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.bienvenida}>Iniciar sesión</Text>

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="nombre@correo.cl"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!cargando}
          />

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputFila}>
            <TextInput
              style={[styles.input, styles.inputPassword]}
              placeholder="Tu contraseña"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!verPassword}
              value={password}
              onChangeText={setPassword}
              editable={!cargando}
            />
            <TouchableOpacity style={styles.ojo} onPress={() => setVerPassword((v) => !v)}>
              <Text style={styles.ojoTexto}>{verPassword ? 'Ocultar' : 'Mostrar'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setAyudaAbierta(true)} style={styles.olvido}>
            <Text style={styles.olvidoTexto}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonDeshabilitado]}
            onPress={handleLogin}
            disabled={cargando}
            activeOpacity={0.85}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botonTexto}>Ingresar</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.pie}>Uso exclusivo del personal autorizado</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Ayuda: el backend aún no tiene recuperación automática de contraseña */}
      <Modal
        visible={ayudaAbierta}
        transparent
        animationType="slide"
        onRequestClose={() => setAyudaAbierta(false)}
        statusBarTranslucent
      >
        <View style={styles.modalFondo}>
          <Pressable style={{ flex: 1 }} onPress={() => setAyudaAbierta(false)} />
          <View style={[styles.modalPanel, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.asa} />
            <Text style={styles.modalEmoji}>🔑</Text>
            <Text style={styles.modalTitulo}>¿Olvidaste tu contraseña?</Text>
            <Text style={styles.modalTexto}>
              Por seguridad, la contraseña la restablece el administrador de tu compañía.
            </Text>
            <Text style={styles.modalPaso}>1. Comunícate con tu administrador.</Text>
            <Text style={styles.modalPaso}>
              2. Indícale el correo con el que ingresas{email.trim() ? `: ${email.trim()}` : ''}.
            </Text>
            <Text style={styles.modalPaso}>3. Te entregará una contraseña nueva para volver a ingresar.</Text>
            <TouchableOpacity
              style={[styles.boton, { marginTop: 20 }]}
              onPress={() => setAyudaAbierta(false)}
            >
              <Text style={styles.botonTexto}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: '#B91C1C' },
  zonaRoja: { backgroundColor: '#B91C1C' },
  cabecera: { alignItems: 'center', paddingTop: 12, paddingBottom: 44, paddingHorizontal: 24 },
  titulo: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: 3, marginTop: 16 },
  subtitulo: { fontSize: 16, fontWeight: '700', color: '#FEE2E2', marginTop: 2 },
  descripcion: {
    fontSize: 12,
    color: '#FECACA',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  tarjeta: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
  },
  formulario: { paddingHorizontal: 24, paddingTop: 28 },
  bienvenida: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
    fontSize: 16,
    color: '#111827',
  },
  inputFila: { justifyContent: 'center' },
  inputPassword: { paddingRight: 84 },
  ojo: { position: 'absolute', right: 14, top: 0, bottom: 16, justifyContent: 'center' },
  ojoTexto: { color: '#B91C1C', fontWeight: '700', fontSize: 13 },
  olvido: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 14 },
  olvidoTexto: { color: '#B91C1C', fontWeight: '700', fontSize: 13 },
  error: { color: '#B91C1C', marginBottom: 12, textAlign: 'center', fontWeight: '600' },
  boton: {
    backgroundColor: '#B91C1C',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pie: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 22 },
  modalFondo: { flex: 1, backgroundColor: 'rgba(17,24,39,0.45)', justifyContent: 'flex-end' },
  modalPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  asa: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginBottom: 14,
  },
  modalEmoji: { fontSize: 38, textAlign: 'center' },
  modalTitulo: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center', marginTop: 6 },
  modalTexto: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginTop: 8, marginBottom: 14 },
  modalPaso: { fontSize: 14, color: '#374151', marginBottom: 6 },
});
