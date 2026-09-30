import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { crearUsuario, editarUsuario } from '../services/usuario.service';
import { listarRoles, listarCompanias } from '../services/catalogos.service';
import { Usuario, Rol, Compania } from '../types/auth';

export default function UsuarioFormScreen({ route, navigation }: any) {
  const usuarioExistente: Usuario | null = route.params?.usuario ?? null;
  const esEdicion = usuarioExistente !== null;

  const [roles, setRoles] = useState<Rol[]>([]);
  const [companias, setCompanias] = useState<Compania[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);

  const [rut, setRut] = useState(usuarioExistente?.rut ?? '');
  const [nombre, setNombre] = useState(usuarioExistente?.nombre ?? '');
  const [apellidos, setApellidos] = useState(usuarioExistente?.apellidos ?? '');
  const [email, setEmail] = useState(usuarioExistente?.email ?? '');
  const [password, setPassword] = useState('');
  const [idRol, setIdRol] = useState<number | null>(usuarioExistente?.id_rol ?? null);
  const [idCompania, setIdCompania] = useState<number | null>(usuarioExistente?.id_compania ?? null);
  const [estadoActivo, setEstadoActivo] = useState(usuarioExistente?.estado_activo ?? true);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar usuario' : 'Nuevo usuario' });

    async function cargarCatalogos() {
      try {
        const [rolesData, companiasData] = await Promise.all([listarRoles(), listarCompanias()]);
        setRoles(rolesData);
        setCompanias(companiasData);
        if (!esEdicion) {
          if (rolesData[0]) setIdRol(rolesData[0].id_rol);
          if (companiasData[0]) setIdCompania(companiasData[0].id_compania);
        }
      } catch {
        setError('No se pudieron cargar los catálogos de roles y compañías.');
      } finally {
        setCargandoCatalogos(false);
      }
    }
    cargarCatalogos();
  }, []);

  function validar(): string | null {
    if (!rut.trim()) return 'El RUT es obligatorio.';
    if (!nombre.trim()) return 'El nombre es obligatorio.';
    if (!apellidos.trim()) return 'Los apellidos son obligatorios.';
    if (!email.trim()) return 'El correo es obligatorio.';
    if (!esEdicion && password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!idRol) return 'Selecciona un rol.';
    if (!idCompania) return 'Selecciona una compañía.';
    return null;
  }

  async function handleGuardar() {
    const mensajeValidacion = validar();
    if (mensajeValidacion) {
      setError(mensajeValidacion);
      return;
    }

    setError(null);
    setGuardando(true);
    try {
      if (esEdicion) {
        await editarUsuario(usuarioExistente!.id_usuario, {
          rut: rut.trim(),
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          email: email.trim(),
          id_rol: idRol!,
          id_compania: idCompania!,
          estado_activo: estadoActivo,
        });
      } else {
        await crearUsuario({
          rut: rut.trim(),
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          email: email.trim(),
          password,
          id_rol: idRol!,
          id_compania: idCompania!,
          estado_activo: estadoActivo,
        });
      }
      navigation.goBack();
    } catch (err: any) {
      const mensaje = err?.response?.data?.message ?? 'No se pudo guardar el usuario.';
      setError(Array.isArray(mensaje) ? mensaje.join('\n') : mensaje);
    } finally {
      setGuardando(false);
    }
  }

  function handleDeshabilitar() {
    Alert.alert(
      'Deshabilitar usuario',
      `¿Confirmas deshabilitar a ${usuarioExistente?.nombre}? No podrá iniciar sesión hasta que un administrador lo vuelva a activar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deshabilitar',
          style: 'destructive',
          onPress: async () => {
            setGuardando(true);
            try {
              await editarUsuario(usuarioExistente!.id_usuario, { estado_activo: false });
              navigation.goBack();
            } catch {
              setError('No se pudo deshabilitar el usuario.');
              setGuardando(false);
            }
          },
        },
      ],
    );
  }

  if (cargandoCatalogos) {
    return (
      <SafeAreaView style={styles.centro} edges={['bottom']}>
        <ActivityIndicator size="large" color="#B91C1C" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Datos personales</Text>

          <Text style={styles.label}>RUT</Text>
          <TextInput style={styles.input} value={rut} onChangeText={setRut} placeholder="12345678-9" />

          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

          <Text style={styles.label}>Apellidos</Text>
          <TextInput style={styles.input} value={apellidos} onChangeText={setApellidos} />

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {!esEdicion && (
            <>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Rol y compañía</Text>

          <Text style={styles.label}>Rol</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={idRol} onValueChange={(v) => setIdRol(v)}>
              {roles.map((r) => (
                <Picker.Item key={r.id_rol} label={r.nombre_rol} value={r.id_rol} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Compañía</Text>
          <View style={styles.pickerWrapper}>
            <Picker selectedValue={idCompania} onValueChange={(v) => setIdCompania(v)}>
              {companias.map((c) => (
                <Picker.Item key={c.id_compania} label={c.nombre} value={c.id_compania} />
              ))}
            </Picker>
          </View>

          {esEdicion && (
            <View style={styles.switchRow}>
              <Text style={styles.label}>Usuario activo</Text>
              <Switch value={estadoActivo} onValueChange={setEstadoActivo} />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.boton, guardando && styles.botonDeshabilitado]}
          onPress={handleGuardar}
          disabled={guardando}
        >
          {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botonTexto}>Guardar</Text>}
        </TouchableOpacity>

        {esEdicion && usuarioExistente!.estado_activo && (
          <TouchableOpacity style={styles.botonSecundario} onPress={handleDeshabilitar} disabled={guardando}>
            <Text style={styles.botonSecundarioTexto}>Deshabilitar usuario</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  contenido: { padding: 16, paddingBottom: 40 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  pickerWrapper: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: '#fff' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  boton: {
    backgroundColor: '#B91C1C',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  botonSecundario: {
    borderWidth: 1.5,
    borderColor: '#B91C1C',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#fff',
  },
  botonSecundarioTexto: { color: '#B91C1C', fontSize: 15, fontWeight: '700' },
});
