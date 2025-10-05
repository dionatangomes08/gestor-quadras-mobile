// import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import React, { useEffect, useState } from 'react';

export default function HomeScreen({ navigation }) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const user = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
        setIsAdmin(user?.tipo === 'admin');
      } catch { setIsAdmin(false); }
    })();
  }, []);
  return (
    <LinearGradient
      colors={["#1e3c72", "#2a5298"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.iconGroup}>
          <Text style={styles.iconLabel}>Agendar</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Agendamento')}>
            <MaterialIcons name="event-available" size={64} color="#1e3c72" />
          </TouchableOpacity>
        </View>
        <View style={styles.iconGroup}>
          <Text style={styles.iconLabel}>Listar Agendas</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Listagem')}>
            <Feather name="list" size={64} color="#1e3c72" />
          </TouchableOpacity>
        </View>
        {isAdmin && (
          <>
            <View style={styles.iconGroup}>
              <Text style={styles.iconLabel}>Cadastrar Usuário</Text>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('CadastroUsuario')}>
                <MaterialIcons name="person-add" size={64} color="#1e3c72" />
              </TouchableOpacity>
            </View>
            <View style={styles.iconGroup}>
              <Text style={styles.iconLabel}>Usuários</Text>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Usuarios')}>
                <MaterialIcons name="people" size={64} color="#1e3c72" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  iconGroup: {
    alignItems: 'center',
    marginVertical: 18,
    width: '100%',
    maxWidth: 300,
  },
  iconLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  iconButton: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#eaf0fa',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});