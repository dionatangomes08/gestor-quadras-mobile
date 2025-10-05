import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Picker, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AgendamentoScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingReserva, setPendingReserva] = useState(null);
  const [warning, setWarning] = useState('');
  const [warningModal, setWarningModal] = useState(false);
  const [quadras, setQuadras] = useState([]);
  const [quadraId, setQuadraId] = useState('');
  const [data, setData] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [acompanhantes, setAcompanhantes] = useState([{ nome: '', tipo: 'socio', id: '' }]);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Buscar quadras e sócios ao abrir
    useEffect(() => {
      (async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const resQuadras = await axios.get('http://localhost:3000/api/quadras', config);
          setQuadras(resQuadras.data);
          const resSocios = await axios.get('http://localhost:3000/api/users/socios', config);
          setUsuarios(resSocios.data);
        } catch (e) {
          setError('Erro ao buscar quadras ou sócios.');
        }
      })();
    }, []);
  
    useFocusEffect(
      React.useCallback(() => {
        setQuadraId('');
        setData('');
        setHorarios([]);
        setAgendamentos([]);
        setHorarioSelecionado(null);
        setAcompanhantes([{ nome: '', tipo: 'socio', id: '' }]);
        setError('');
        setSuccess('');
        setWarning('');
        setWarningModal(false);
        setModalVisible(false);
        setPendingReserva(null);
      }, [])
    );

  // Buscar horários e agendamentos ao selecionar quadra/data
  useEffect(() => {
    // Só busca se a data estiver completa (YYYY-MM-DD)
    if (!quadraId || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Buscar horários disponíveis
        const resHorarios = await axios.get(`http://localhost:3000/api/quadra-horarios/${quadraId}`, config);
        const diaSemana = new Date(data + 'T00:00:00').getDay();
        const mapDias = [7,1,2,3,4,5,6];
        const diaSemanaBackend = mapDias[diaSemana];
        const horariosFiltrados = resHorarios.data.filter(h => h.ativo && h.dia_semana === diaSemanaBackend);
        horariosFiltrados.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
        setHorarios(horariosFiltrados);
        // Buscar agendamentos
        const resAgend = await axios.get(`http://localhost:3000/api/agendamentos?quadraId=${quadraId}&data=${data}`, config);
        setAgendamentos(resAgend.data);
      } catch (e) {
        setError('Erro ao buscar horários ou agendamentos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [quadraId, data]);

  // Regras de negócio para mensagens de erro/aviso
  const validateReserva = () => {
    if (!quadraId || !data) return { valid: false, msg: 'Selecione a quadra e a data.' };
    if (!horarioSelecionado) return { valid: false, msg: 'Selecione um horário para reservar.' };
    const acompanhantesFiltrados = acompanhantes
      .filter(a => (a.tipo === 'socio' && a.id) || (a.tipo === 'visitante' && a.nome.trim()));
    if (acompanhantesFiltrados.length === 0) return { valid: false, msg: 'É obrigatório informar ao menos um Jogador.' };
    // Regra: máximo 3 jogadores
    if (acompanhantesFiltrados.length > 3) return { valid: false, msg: 'Máximo de 3 jogadores por reserva.' };
    // Regra: não permitir reserva duplicada no mesmo horário
    const horarioId = horarioSelecionado?.horarioId || horarioSelecionado?.horario_id;
    if (agendamentos.some(a => a.horarioId === horarioId)) return { valid: false, msg: 'Horário já reservado.' };
    // Regra: sócio não pode reservar mais de uma vez no mesmo dia
    // (considerando que o backend já valida, mas aqui mostramos aviso)
    // Regra: admin pode reservar mais de uma vez (exemplo, se precisar)
    // (poderia ser validado pelo tipo de usuário, se disponível)
    return { valid: true, msg: '' };
  };

  const handleReservar = () => {
    setWarning('');
    setError('');
    setSuccess('');
    const validation = validateReserva();
    if (!validation.valid) {
      setWarning(validation.msg);
      setWarningModal(true);
      return;
    }
    // Exibe modal de confirmação
    setPendingReserva({
      quadraId: Number(quadraId),
      horarioId: horarioSelecionado?.horarioId || horarioSelecionado?.horario_id,
      data,
      acompanhantes: acompanhantes
        .filter(a => (a.tipo === 'socio' && a.id) || (a.tipo === 'visitante' && a.nome.trim()))
        .map(a => a.tipo === 'socio'
          ? { tipo: 'socio', usuarioId: Number(a.id) }
          : { nome: a.nome, tipo: 'visitante', taxaPaga: true })
    });
    setModalVisible(true);
  };

  const confirmReserva = async () => {
    setModalVisible(false);
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post('http://localhost:3000/api/reservas', pendingReserva, {
        headers: { Authorization: `Bearer ${token}` }
      });
  setSuccess('Reserva realizada com sucesso!');
  setHorarioSelecionado(null);
  setAcompanhantes([{ nome: '', tipo: 'socio', id: '' }]);
  setData('');
  setHorarios([]);
  setAgendamentos([]);
    } catch (err) {
      let msg = 'Erro ao realizar reserva.';
      if (err?.response?.data?.error) msg = err.response.data.error;
      setError(msg);
    } finally {
      setLoading(false);
      setPendingReserva(null);
    }
  };

  return (
    <LinearGradient
      colors={["#1e3c72", "#2a5298"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, {color: '#000'}]}>Reservar Quadra</Text>
        {/* Seleção de quadra */}
        <Text style={[styles.label, {color: '#000'}]}>Quadra:</Text>
        <Picker
          selectedValue={quadraId}
          onValueChange={v => { setQuadraId(v); setData(''); setHorarios([]); setAgendamentos([]); setSuccess(''); }}
          style={styles.input}
        >
          <Picker.Item label="Selecione a quadra" value="" color="#000" />
          {quadras.map(q => <Picker.Item key={q.id} label={q.nome} value={q.id} color="#000" />)}
        </Picker>
        {/* Seleção de data */}
        {quadraId ? (
          <>
            <Text style={[styles.label, {color: '#000'}]}>Data da reserva:</Text>
            {Platform.OS === 'web' ? (
              <TextInput
                style={[styles.input, {color: '#000'}]}
                value={data}
                onChangeText={text => {
                  // Aceita apenas números e hífen, limita a 10 caracteres
                  let val = text.replace(/[^\d-]/g, '').slice(0, 10);
                  setData(val);
                }}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#aaa"
              />
            ) : (
              <>
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
                {showDatePicker && (
                  <DateTimePicker
                    value={data ? new Date(data + 'T00:00:00') : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const yyyy = selectedDate.getFullYear();
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        setData(`${yyyy}-${mm}-${dd}`);
                      }
                    }}
                  />
                )}
              </>
            )}
          </>
        ) : null}
        {/* Horários disponíveis */}
        {data && !loading && horarios.length > 0 && (
          <>
            <Text style={[styles.label, {color: '#000'}]}>Horários disponíveis:</Text>
            {horarios.map(h => {
              const horarioId = h.horarioId || h.horario_id;
              const reservado = agendamentos.some(a => a.horarioId === horarioId);
              const selecionado = !!(horarioSelecionado && horarioSelecionado.id === h.id);
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.horarioBtn, selecionado && styles.horarioBtnSel, reservado && styles.horarioBtnRes]}
                  disabled={reservado}
                  onPress={() => setHorarioSelecionado(selecionado ? null : h)}
                >
                  <Text style={{ color: reservado ? '#e74c3c' : '#000', fontWeight: 'bold' }}>{h.nome} {reservado ? '(Reservado)' : ''}</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
        {/* Jogadores */}
        {data && horarios.length > 0 && (
          <>
            <Text style={[styles.label, {color: '#000'}]}>Jogadores (até 3):</Text>
            {acompanhantes.map((a, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Picker
                  selectedValue={a.tipo}
                  style={[styles.input, { flex: 1 }]}
                  onValueChange={tipo => setAcompanhantes(acompanhantes.map((ac, i) => i === idx ? { ...ac, tipo, nome: '', id: '' } : ac))}
                >
                  <Picker.Item label="Sócio" value="socio" color="#000" />
                  <Picker.Item label="Visitante" value="visitante" color="#000" />
                </Picker>
                {a.tipo === 'socio' ? (
                  <Picker
                    selectedValue={a.id}
                    style={[styles.input, { flex: 2 }]}
                    onValueChange={id => setAcompanhantes(acompanhantes.map((ac, i) => i === idx ? { ...ac, id } : ac))}
                  >
                    <Picker.Item label="Selecione o sócio" value="" color="#000" />
                    {usuarios.map(u => <Picker.Item key={u.id} label={u.nome} value={u.id} color="#000" />)}
                  </Picker>
                ) : (
                  <TextInput
                    style={[styles.input, { flex: 2, color: '#000' }]}
                    placeholder="Nome do visitante"
                    placeholderTextColor="#aaa"
                    value={a.nome}
                    onChangeText={nome => setAcompanhantes(acompanhantes.map((ac, i) => i === idx ? { ...ac, nome } : ac))}
                  />
                )}
                {acompanhantes.length > 1 && (
                  <TouchableOpacity onPress={() => setAcompanhantes(acompanhantes.filter((_, i) => i !== idx))}>
                    <Text style={{ color: '#e74c3c', fontWeight: 'bold', fontSize: 22, marginLeft: 8 }}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {acompanhantes.length < 3 && (
              <TouchableOpacity onPress={() => setAcompanhantes([...acompanhantes, { nome: '', tipo: 'socio', id: '' }])}>
                <Text style={{ color: '#0984e3', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>+ Adicionar Jogador</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {/* Botão reservar */}
        <TouchableOpacity
          style={[styles.button, (!horarioSelecionado || loading) && { backgroundColor: '#b2bec3' }]}
          onPress={handleReservar}
          disabled={!horarioSelecionado || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reservar</Text>}
        </TouchableOpacity>
        {/* Modal de aviso/erro de regra de negócio */}
        <Modal
          visible={warningModal}
          transparent
          animationType="fade"
          onRequestClose={() => setWarningModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320, alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#e67e22', marginBottom: 12 }}>Atenção</Text>
              <Text style={{ color: '#000', marginBottom: 18, textAlign: 'center' }}>{warning}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#e67e22', padding: 12, borderRadius: 8, minWidth: 100, alignItems: 'center' }}
                onPress={() => setWarningModal(false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {success ? <Text style={{ color: '#27ae60', marginTop: 10 }}>{success}</Text> : null}
        {error ? <Text style={{ color: '#e74c3c', marginTop: 10 }}>{error}</Text> : null}

        {/* Modal de confirmação de reserva */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320, alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#1e3c72', marginBottom: 12 }}>Confirmar Reserva?</Text>
              <Text style={{ color: '#000', marginBottom: 8 }}>Quadra: {quadras.find(q => q.id == pendingReserva?.quadraId)?.nome || ''}</Text>
              <Text style={{ color: '#000', marginBottom: 8 }}>Data: {pendingReserva?.data ? (() => { const [y,m,d]=pendingReserva.data.split('-'); return `${d}/${m}/${y}` })() : ''}</Text>
              <Text style={{ color: '#000', marginBottom: 8 }}>Horário: {horarios.find(h => (h.horarioId || h.horario_id) == pendingReserva?.horarioId)?.nome || ''}</Text>
              <Text style={{ color: '#000', marginBottom: 8 }}>Jogadores:</Text>
              {pendingReserva?.acompanhantes?.map((a, i) => (
                <Text key={i} style={{ color: '#000' }}>{a.tipo === 'socio' ? usuarios.find(u => u.id == a.usuarioId)?.nome : a.nome} ({a.tipo})</Text>
              ))}
              <View style={{ flexDirection: 'row', marginTop: 18 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#27ae60', padding: 12, borderRadius: 8, marginRight: 12 }}
                  onPress={confirmReserva}
                  disabled={loading}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: '#e74c3c', padding: 12, borderRadius: 8 }}
                  onPress={() => setModalVisible(false)}
                  disabled={loading}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 12,
    padding: 24,
    marginVertical: 32,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3c72',
    marginBottom: 18,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#1e3c72',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    color: '#2d3436',
  },
  horarioBtn: {
    borderWidth: 1,
    borderColor: '#1e3c72',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#eaf0fa',
    alignItems: 'center',
  },
  horarioBtnSel: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  horarioBtnRes: {
    backgroundColor: '#e74c3c22',
    borderColor: '#e74c3c',
  },
  button: {
    backgroundColor: '#0984e3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});