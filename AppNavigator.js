import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import AgendamentoScreen from './screens/AgendamentoScreen';
import ListagemScreen from './screens/ListagemScreen';
import CadastroUsuarioScreen from './screens/CadastroUsuarioScreen';
import UsuariosScreen from './screens/UsuariosScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';


const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Sair"
        labelStyle={{ color: '#e74c3c', fontWeight: 'bold' }}
        icon={({ size }) => (
          <MaterialIcons name="logout" size={size} color="#e74c3c" />
        )}
        onPress={() => {
          // Redireciona para login e limpa navegação
          props.navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }}
      />
    </DrawerContentScrollView>
  );
}

function MainDrawer() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  React.useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
        const user = JSON.parse(jsonPayload);
        setIsAdmin(user?.tipo === 'admin');
      } catch { setIsAdmin(false); }
    })();
  }, []);
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#dbeafe',
        drawerActiveBackgroundColor: '#1e3c72',
        drawerInactiveBackgroundColor: 'transparent',
        drawerStyle: {
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          backgroundColor: '#1e3c72',
        },
        drawerLabelStyle: { fontWeight: 'bold', fontSize: 16 },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Tela Inicial',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Listagem"
        component={ListagemScreen}
        options={{
          title: 'Listagem',
          drawerIcon: ({ color, size }) => (
            <Feather name="list" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Agendamento"
        component={AgendamentoScreen}
        options={{
          title: 'Agendamento',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="event-available" size={size} color={color} />
          ),
        }}
      />
      {isAdmin && (
        <>
          <Drawer.Screen
            name="CadastroUsuario"
            component={CadastroUsuarioScreen}
            options={{
              title: 'Cadastrar Usuário',
              drawerIcon: ({ color, size }) => (
                <MaterialIcons name="person-add" size={size} color={color} />
              ),
            }}
          />
          <Drawer.Screen
            name="Usuarios"
            component={UsuariosScreen}
            options={{
              title: 'Usuários',
              drawerIcon: ({ color, size }) => (
                <MaterialIcons name="people" size={size} color={color} />
              ),
            }}
          />
        </>
      )}
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}