import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { listarDespachosEnCurso } from '../services/despacho.service';
import { DespachoEmergencia } from '../types/despacho';
import DespachoCard from '../components/DespachoCard';
import MenuAjustes from '../components/MenuAjustes';
import { esMecanico } from '../utils/roles';
import { obtenerDashboard, obtenerAlertasMantencion } from '../services/estadisticas.service';
import { DashboardEstadisticas, AlertaMantencion, ConteoPorEstado } from '../types/estadisticas';


function total(lista: ConteoPorEstado[] | undefined, ...estados: string[]): number {
  if (!lista) return 0;
  return lista
    .filter((i) => estados.includes(i.estado))
    .reduce((acc, i) => acc + Number(i.total), 0);
}

interface StatDef {
  valor: number | string;
  etiqueta: string;
  color: string;
  fondo: string;
  ruta?: string;
}


export default function HomeScreen({ navigation }: any) {
  const { usuario, logout } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardEstadisticas | null>(null);
  const [alertas, setAlertas] = useState<AlertaMantencion[] | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [despachos, setDespachos] = useState<DespachoEmergencia[]>([]);
  const { conectado, suscribir } = useRealtime();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const mecanico = esMecanico(usuario?.rol);

  // Si una de las dos consultas falla, la otra igual se muestra (allSettled).
  async function cargarResumen() {
    const [d, a, desp] = await Promise.allSettled([
      obtenerDashboard(),
      obtenerAlertasMantencion(),
      mecanico ? Promise.resolve([] as DespachoEmergencia[]) : listarDespachosEnCurso(),
    ]);
    setDespachos(desp.status === 'fulfilled' ? desp.value : []);
    setDashboard(d.status === 'fulfilled' ? d.value : null);
    setAlertas(a.status === 'fulfilled' ? a.value : null);
  }

  useFocusEffect(
    useCallback(() => {
      cargarResumen();
    }, []),
  );

  // Si llega un despacho nuevo en vivo, se refresca el resumen del inicio.
  useEffect(() => {
    if (mecanico) return;
    return suscribir('nuevo_despacho', () => {
      cargarResumen();
    });
  }, [suscribir, mecanico]);

  async function onRefresh() {
    setRefrescando(true);
    await cargarResumen();
    setRefrescando(false);
  }

  const criticas = alertas?.filter((x) => x.nivel_alerta === 'critica').length ?? 0;
  const sinDatos = '–';

  const statsFlota: StatDef[] = [
    {
      valor: dashboard ? total(dashboard.flota, 'operativo') : sinDatos,
      etiqueta: 'Operativos',
      color: '#166534',
      fondo: '#DCFCE7',
      ruta: 'VehiculosList',
    },
    {
      valor: dashboard ? total(dashboard.flota, 'en_mantencion') : sinDatos,
      etiqueta: 'En mantención',
      color: '#854D0E',
      fondo: '#FEF9C3',
      ruta: 'VehiculosList',
    },
    {
      valor: dashboard ? total(dashboard.flota, 'fuera_de_servicio') : sinDatos,
      etiqueta: 'Fuera de servicio',
      color: '#991B1B',
      fondo: '#FEE2E2',
      ruta: 'VehiculosList',
    },
  ];

  const statsOtros: StatDef[] = [
    {
      valor: dashboard ? total(dashboard.mantenciones, 'pendiente', 'en_proceso') : sinDatos,
      etiqueta: 'Mantenciones activas',
      color: '#1E40AF',
      fondo: '#DBEAFE',
    },
    {
      valor: alertas ? alertas.length : sinDatos,
      etiqueta: alertas && criticas > 0 ? `Alertas (${criticas} críticas)` : 'Alertas de mantención',
      color: '#9A3412',
      fondo: '#FFEDD5',
    },
    {
      valor: dashboard ? dashboard.inventario?.articulos_bajo_stock ?? 0 : sinDatos,
      etiqueta: 'Repuestos con poco stock',
      color: '#374151',
      fondo: '#E5E7EB',
    },
  ];

  function Tile({ s }: { s: StatDef }) {
    const contenido = (
      <>
        <Text style={[styles.statValor, { color: s.color }]}>{s.valor}</Text>
        <Text style={[styles.statEtiqueta, { color: s.color }]} numberOfLines={2}>
          {s.etiqueta}
        </Text>
      </>
    );
    return s.ruta ? (
      <TouchableOpacity
        style={[styles.stat, { backgroundColor: s.fondo }]}
        onPress={() => navigation.navigate(s.ruta!)}
      >
        {contenido}
      </TouchableOpacity>
    ) : (
      <View style={[styles.stat, { backgroundColor: s.fondo }]}>{contenido}</View>
    );
  }

  function abrirMenu() {
    setMenuAbierto(true);
  }

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'SIGEV',
      headerStyle: { backgroundColor: '#B91C1C' },
      headerShadowVisible: false,
      headerTintColor: '#fff',
      headerTitleStyle: { color: '#fff', fontWeight: '800' },
      headerRight: () => (
        <TouchableOpacity style={styles.menuBoton} onPress={abrirMenu}>
          <Text style={styles.menuTexto}>⋮</Text>
        </TouchableOpacity>
      ),
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
      >
        <Text style={styles.saludo}>Hola, {usuario?.nombre}</Text>
        <Text style={styles.detalle}>
          {usuario?.rol} — {usuario?.compania}
        </Text>
        <Text style={[styles.conexion, { color: conectado ? '#166534' : '#9CA3AF' }]}>
          {conectado ? '● En línea (notificaciones en vivo)' : '○ Sin conexión en tiempo real'}
        </Text>

        <Text style={styles.seccion}>Resumen</Text>
        <View style={styles.statFila}>
          {statsFlota.map((st) => (
            <Tile key={st.etiqueta} s={st} />
          ))}
        </View>
        <View style={styles.statFila}>
          {statsOtros.map((st) => (
            <Tile key={st.etiqueta} s={st} />
          ))}
        </View>

        {!mecanico && (
          <>
            <View style={styles.seccionFila}>
              <Text style={styles.seccion}>Despachos en curso</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DespachosList')}>
                <Text style={styles.verTodos}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            {despachos.length === 0 ? (
              <Text style={styles.sinDespachos}>No hay despachos en curso. ✅</Text>
            ) : (
              despachos.slice(0, 2).map((d) => (
                <View key={d.id_despacho} style={{ marginBottom: 12 }}>
                  <DespachoCard despacho={d} />
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
      <MenuAjustes
        visible={menuAbierto}
        onClose={() => setMenuAbierto(false)}
        onLogout={() => {
          setMenuAbierto(false);
          logout();
        }}
        onNavigate={(ruta) => navigation.navigate(ruta)}
        conectado={conectado}
        despachosEnCurso={despachos.length}
        usuario={usuario}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  contenido: { padding: 20, paddingBottom: 40 },
  saludo: { fontSize: 22, fontWeight: 'bold' },
  detalle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 20 },
  conexion: { fontSize: 12, fontWeight: '600', marginTop: -14, marginBottom: 16 },
  seccionFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verTodos: { fontSize: 13, fontWeight: '700', color: '#B91C1C' },
  sinDespachos: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  seccion: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8, marginTop: 4 },
  statFila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  stat: { width: '31.5%', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 10 },
  statValor: { fontSize: 26, fontWeight: '800' },
  statEtiqueta: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  menuBoton: { paddingHorizontal: 12, paddingVertical: 4 },
  menuTexto: { fontSize: 26, fontWeight: '900', color: '#fff' },
});
