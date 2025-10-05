import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function UsuariosScreen() {
  // Estado para modal de confirmação de exclusão
  const [deleteModal, setDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  // Função para abrir o modal de edição e preencher os campos
  const openEdit = (user) => {
    setEditUser(user);
    setEditNome(user.nome);
    setEditEmail(user.email);
    setEditTipo(user.tipo);
    setEditSenha('');
    setEditModal(true);
  };

  // Função para editar o usuário
  const handleEdit = async () => {
    if (!editNome || !editEmail) {
      Alert.alert('Preencha nome e e-mail.');
      return;
    }
    setEditLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/users/${editUser.id}`, {
        nome: editNome,
        email: editEmail,
        tipo: editTipo,
        senha: editSenha || undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditModal(false);
      setEditUser(null);
      setEditNome('');
      setEditEmail('');
      setEditTipo('socio');
      setEditSenha('');
      fetchUsuarios();
    } catch (e) {
      Alert.alert('Erro ao editar usuário.');
    }
    setEditLoading(false);
  };
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTipo, setEditTipo] = useState('socio');
  const [editSenha, setEditSenha] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Abre o modal de confirmação
  const handleDelete = (user) => {
    setUserToDelete(user);
    setDeleteModal(true);
  };

  // Confirma a exclusão
  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/users/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteModal(false);
      setUserToDelete(null);
      fetchUsuarios();
    } catch (e) {
      setDeleteModal(false);
      setUserToDelete(null);
      Alert.alert('Erro ao excluir usuário.');
    }
  };

  // Função para buscar usuários (caso não exista, adicione)
  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(res.data);
      setError('');
    } catch (e) {
      setError('Erro ao buscar usuários.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return (
    <LinearGradient colors={["#1e3c72", "#2a5298"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Usuários</Text>
        {loading ? (
          <ActivityIndicator color="#1e3c72" size="large" style={{ marginTop: 30 }} />
        ) : error ? (
          <Text style={{ color: '#e74c3c', marginTop: 20 }}>{error}</Text>
        ) : (
          <ScrollView style={{ width: '100%' }}>
            {usuarios.length === 0 ? (
              <Text style={{ color: '#555', textAlign: 'center', marginTop: 30 }}>Nenhum usuário encontrado.</Text>
            ) : (
              usuarios.map(u => (
                <View key={u.id} style={styles.card}>
                  <Text style={styles.label}><Text style={styles.bold}>Nome:</Text> {u.nome}</Text>
                  <Text style={styles.label}><Text style={styles.bold}>E-mail:</Text> {u.email}</Text>
                  <Text style={styles.label}><Text style={styles.bold}>Tipo:</Text> {u.tipo}</Text>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(u)}>
                      <MaterialIcons name="edit" size={24} color="#1e3c72" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(u)}>
                      <MaterialIcons name="delete" size={24} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
        {/* Modal de confirmação de exclusão */}
        <Modal visible={deleteModal} animationType="fade" transparent>
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { alignItems: 'center' }]}> 
              <Text style={[styles.title, { marginBottom: 10 }]}>Confirmar exclusão</Text>
              <Text style={{ color: '#222', fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
                Tem certeza que deseja excluir o usuário
                {userToDelete ? ` "${userToDelete.nome}"` : ''}?
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#e74c3c', minWidth: 90 }]} onPress={() => { setDeleteModal(false); setUserToDelete(null); }}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { minWidth: 90 }]} onPress={confirmDelete}>
                  <Text style={styles.buttonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de edição */}
        <Modal visible={editModal} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>Editar Usuário</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome"
                value={editNome}
                onChangeText={setEditNome}
                placeholderTextColor="#aaa"
              />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                value={editEmail}
                onChangeText={setEditEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#aaa"
              />
              <Text style={styles.label}>Tipo:</Text>
              <View style={{ borderWidth: 1, borderColor: '#dbeafe', borderRadius: 6, marginBottom: 10, backgroundColor: '#f3f6fa' }}>
                <Picker
                  selectedValue={editTipo}
                  style={{ color: '#000' }}
                  onValueChange={setEditTipo}
                >
                  <Picker.Item label="Sócio" value="socio" />
                  <Picker.Item label="Administrador" value="admin" />
                </Picker>
              </View>
              <Text style={styles.label}>Senha (opcional):</Text>
              <TextInput
                style={styles.input}
                placeholder="Nova senha"
                value={editSenha}
                onChangeText={setEditSenha}
                secureTextEntry
                placeholderTextColor="#aaa"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                <TouchableOpacity style={[styles.button, { backgroundColor: '#e74c3c' }]} onPress={() => setEditModal(false)} disabled={editLoading}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleEdit} disabled={editLoading}>
                  {editLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    minHeight: 200,
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
  input: {
    backgroundColor: '#f3f6fa',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    color: '#000',
  },
  editBtn: {
    backgroundColor: 'transparent',
    padding: 4,
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    padding: 4,
  },
  actionBtns: {
    flexDirection: 'row',
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 8,
  },
  button: {
    backgroundColor: '#1e3c72',
    borderRadius: 6,
    padding: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'stretch',
  },
});
