import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import UsuariosListScreen from '../screens/UsuariosListScreen';
import UsuarioFormScreen from '../screens/UsuarioFormScreen';
import VehiculosListScreen from '../screens/VehiculosListScreen';
import VehiculoDetalleScreen from '../screens/VehiculoDetalleScreen';
import RegistroOperatividadFormScreen from '../screens/RegistroOperatividadFormScreen';
import MantencionesListScreen from '../screens/MantencionesListScreen';
import MantencionFormScreen from '../screens/MantencionFormScreen';
import MantencionDetalleScreen from '../screens/MantencionDetalleScreen';
import RepuestoFormScreen from '../screens/RepuestoFormScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#B91C1C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {usuario ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="UsuariosList"
              component={UsuariosListScreen}
              options={{ title: 'Personal' }}
            />
            <Stack.Screen
              name="UsuarioForm"
              component={UsuarioFormScreen}
              options={{ title: 'Usuario' }}
            />
            <Stack.Screen
              name="VehiculosList"
              component={VehiculosListScreen}
              options={{ title: 'Vehículos' }}
            />
            <Stack.Screen
              name="VehiculoDetalle"
              component={VehiculoDetalleScreen}
              options={{ title: 'Detalle del vehículo' }}
            />
            <Stack.Screen
              name="RegistroOperatividadForm"
              component={RegistroOperatividadFormScreen}
              options={{ title: 'Registrar revisión' }}
            />
            <Stack.Screen
              name="MantencionesList"
              component={MantencionesListScreen}
              options={{ title: 'Mantenciones' }}
            />
            <Stack.Screen
              name="MantencionForm"
              component={MantencionFormScreen}
              options={{ title: 'Nueva mantención' }}
            />
            <Stack.Screen
              name="MantencionDetalle"
              component={MantencionDetalleScreen}
              options={{ title: 'Mantención' }}
            />
            <Stack.Screen
              name="RepuestoForm"
              component={RepuestoFormScreen}
              options={{ title: 'Agregar repuesto' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
