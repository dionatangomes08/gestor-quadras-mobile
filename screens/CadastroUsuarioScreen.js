import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Picker, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
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

export default function CadastroUsuarioScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('socio');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const u = parseJwt(token);
      setUser(u);
      if (!u || u.tipo !== 'admin') {
        Alert.alert('Acesso negado', 'Apenas administradores podem acessar esta tela.');
        navigation.goBack && navigation.goBack();
      }
    })();
  }, []);
  
  useFocusEffect(
    React.useCallback(() => {
      setNome('');
      setEmail('');
      setSenha('');
      setTipo('socio');
      setError('');
      setSuccess('');
    }, [])
  );

  const handleCadastro = async () => {
    setError('');
    setSuccess('');
    if (!nome || !email || !senha || !tipo) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post('http://localhost:3000/api/users/register', {
        nome, email, senha, tipo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Usuário cadastrado com sucesso!');
      setNome(''); setEmail(''); setSenha(''); setTipo('socio');
    } catch (err) {
      let msg = 'Erro ao cadastrar usuário.';
      if (err?.response?.data?.error) msg = err.response.data.error;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#1e3c72", "#2a5298"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Cadastro de Usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={nome}
          onChangeText={setNome}
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholderTextColor="#aaa"
        />
        <Text style={styles.label}>Tipo de usuário:</Text>
        <Picker
          selectedValue={tipo}
          style={styles.input}
          onValueChange={setTipo}
        >
          <Picker.Item label="Sócio" value="socio" />
          <Picker.Item label="Administrador" value="admin" />
        </Picker>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleCadastro} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Cadastrar</Text>}
        </TouchableOpacity>
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
    alignItems: 'stretch',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3c72',
    marginBottom: 18,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f3f6fa',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    color: '#000',
  },
  label: {
    color: '#222',
    fontSize: 15,
    marginBottom: 2,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#1e3c72',
    borderRadius: 6,
    padding: 12,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: '#e74c3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  success: {
    color: '#27ae60',
    marginBottom: 8,
    textAlign: 'center',
  },
});
