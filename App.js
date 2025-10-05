import * as React from 'react';
import { NavigationContainer, DefaultTheme, DrawerActions } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import UsuariosScreen from './screens/UsuariosScreen';
import AgendamentoScreen from './screens/AgendamentoScreen';
import CadastroUsuarioScreen from './screens/CadastroUsuarioScreen';
import ListagemScreen from './screens/ListagemScreen';
import LoginScreen from './screens/LoginScreen';

const Drawer = createDrawerNavigator();

const drawerTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#1e3c72',
    primary: '#2a5298',
    card: '#39588f',
    text: '#fff',
  },
};

export default function App() {
  const [logged, setLogged] = React.useState(false);
  React.useEffect(() => {
    AsyncStorage.getItem('token').then(token => setLogged(!!token));
  }, []);

  // Função de logout compartilhada
  const handleLogout = async (navigation) => {
    await AsyncStorage.removeItem('token');
    setLogged(false);
    navigation.dispatch(DrawerActions.closeDrawer());
    // Removido navigation.navigate('Login') para evitar erro
  };

  function CustomDrawerContent(props) {
    const [drawerLogged, setDrawerLogged] = React.useState(logged);
    React.useEffect(() => {
      setDrawerLogged(logged);
    }, [logged, props.state]);

    return (
      <DrawerContentScrollView {...props} style={{ backgroundColor: '#1e3c72' }}>
        <DrawerItemList {...props} />
        {drawerLogged && (
          <DrawerItem
            label="Sair"
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
            style={{ backgroundColor: '#39588f', marginTop: 16, borderRadius: 8 }}
            onPress={() => handleLogout(props.navigation)}
            icon={() => <MaterialIcons name="logout" size={24} color="#fff" />}
          />
        )}
      </DrawerContentScrollView>
    );
  }

  return (
    <NavigationContainer theme={drawerTheme}>
      <Drawer.Navigator
        initialRouteName={logged ? 'Home' : 'Login'}
        drawerContent={props => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerStyle: { backgroundColor: '#1e3c72' },
          headerStyle: { backgroundColor: '#39588f' },
          headerTintColor: '#fff',
          drawerActiveTintColor: '#fff',
          drawerInactiveTintColor: '#b0c4de',
        }}
      >
        {logged ? (
          <>
            <Drawer.Screen name="Home" component={HomeScreen} />
            <Drawer.Screen name="Usuários" component={UsuariosScreen} />
            <Drawer.Screen name="Reservar Quadra" component={AgendamentoScreen} />
            <Drawer.Screen name="Cadastro de Usuário" component={CadastroUsuarioScreen} />
            <Drawer.Screen name="Reservas" component={ListagemScreen} />
          </>
        ) : (
          <Drawer.Screen name="Login">
            {props => <LoginScreen {...props} setLogged={setLogged} />}
          </Drawer.Screen>
        )}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
