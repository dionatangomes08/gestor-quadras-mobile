import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Picker, TextInput, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}


export default function ListagemScreen() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quadras, setQuadras] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [quadraId, setQuadraId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [data, setData] = useState('');
  const [user, setUser] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const u = parseJwt(token);
      setUser(u);
      // Quadras
      try {
        const resQ = await axios.get('http://localhost:3000/api/quadras', { headers: { Authorization: `Bearer ${token}` } });
        setQuadras(resQ.data);
      } catch {}
      // Sócios (apenas admin)
      if (u?.tipo === 'admin') {
        try {
          const resU = await axios.get('http://localhost:3000/api/users/socios', { headers: { Authorization: `Bearer ${token}` } });
          setUsuarios(resU.data);
        } catch {}
      }
    })();
  }, []);
  
  useFocusEffect(
    React.useCallback(() => {
      setQuadraId('');
      setUsuarioId('');
      setData('');
      setError('');
      setAgendamentos([]);
    }, [])
  );

  const buscarAgendamentos = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Usuário não autenticado');
      let params = {};
      if (user?.tipo === 'admin') {
        if (quadraId) params.quadraId = quadraId;
        if (usuarioId) params.usuarioId = usuarioId;
        if (data) params.data = data;
        if (!quadraId && !usuarioId && !data) {
          setAgendamentos([]);
          setError('Selecione pelo menos um filtro para buscar reservas.');
          setLoading(false);
          return;
        }
      } else {
        params.usuarioId = user?.id;
        if (data) params.data = data;
      }
      const res = await axios.get('http://localhost:3000/api/reservas-admin', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setAgendamentos(res.data);
    } catch (e) {
      setError('Erro ao buscar reservas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) buscarAgendamentos();
    // eslint-disable-next-line
  }, [user]);

  return (
    <LinearGradient
      colors={["#1e3c72", "#2a5298"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Minhas Reservas</Text>
        {/* Filtros */}
        {user && (
          <View style={{ marginBottom: 16 }}>
            {user.tipo === 'admin' && (
              <>
                <Text style={styles.label}>Quadra:</Text>
                <Picker
                  selectedValue={quadraId}
                  style={styles.input}
                  onValueChange={v => setQuadraId(v)}
                >
                  <Picker.Item label="Todas" value="" />
                  {quadras.map(q => <Picker.Item key={q.id} label={q.nome} value={q.id} />)}
                </Picker>
                <Text style={styles.label}>Usuário (sócio):</Text>
                <Picker
                  selectedValue={usuarioId}
                  style={styles.input}
                  onValueChange={v => setUsuarioId(v)}
                >
                  <Picker.Item label="Todos" value="" />
                  {usuarios.map(u => <Picker.Item key={u.id} label={u.nome} value={u.id} />)}
                </Picker>
              </>
            )}
            <Text style={styles.label}>Data:</Text>
            {Platform.OS === 'web' ? (
              <TextInput
                style={[styles.input, {color: '#000'}]}
                value={data}
                onChangeText={text => {
                  let val = text.replace(/[^\d-]/g, '').slice(0, 10);
                  setData(val);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#aaa"
              />
            ) : (
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <TextInput
                  style={[styles.input, {color: '#000'}]}
                  value={data ? (() => { const [y,m,d]=data.split('-'); return `${d}/${m}/${y}` })() : ''}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#aaa"
                  editable={false}
                  pointerEvents="none"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={{ backgroundColor: '#1e3c72', borderRadius: 6, padding: 10, marginTop: 8 }} onPress={buscarAgendamentos}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Buscar</Text>
            </TouchableOpacity>
          </View>
        )}
        {loading ? (
          <ActivityIndicator color="#1e3c72" size="large" style={{ marginTop: 30 }} />
        ) : error ? (
          <Text style={{ color: '#e74c3c', marginTop: 20 }}>{error}</Text>
        ) : (
          <View style={{ flex: 1, minHeight: 200 }}>
            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 40 }}>
              {agendamentos.length === 0 ? (
                <Text style={{ color: '#555', textAlign: 'center', marginTop: 30 }}>Nenhuma reserva encontrada.</Text>
              ) : (
                agendamentos.map(a => (
                  <View key={a.id} style={styles.card}>
                    <Text style={styles.label}><Text style={styles.bold}>Quadra:</Text> {a.Quadra?.nome || '-'}</Text>
                    <Text style={styles.label}><Text style={styles.bold}>Data:</Text> {a.data ? (() => { const [y,m,d]=a.data.split('-'); return `${d}/${m}/${y}` })() : '-'}</Text>
                    <Text style={styles.label}><Text style={styles.bold}>Horário:</Text> {a.Horario?.nome || '-'}</Text>
                    <Text style={styles.label}><Text style={styles.bold}>Usuário:</Text> {a.Usuario?.nome || '-'}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '95%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 200,
    flex: 1,
  },
  input: {
    backgroundColor: '#f3f6fa',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    color: '#000',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3c72',
    marginBottom: 18,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#eaf0fa',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    color: '#222',
    fontSize: 15,
    marginBottom: 2,
  },
  bold: {
    fontWeight: 'bold',
    color: '#1e3c72',
  },
});