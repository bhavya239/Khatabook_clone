import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Alert
} from 'react-native';
import api from '../../lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { CheckCircle2, Circle, Plus, Trash2, CalendarDays } from 'lucide-react-native';

const FILTERS = ['All', 'Pending', 'Completed'];

export default function TodosScreen() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('All');

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/todos');
      setTodos(res.data.data || res.data.todos || []);
    } catch (err) {
      console.error('Todos fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchTodos(); }, []));

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      await api.post('/todos', { title: newTask.trim(), status: 'pending' });
      setNewTask('');
      fetchTodos();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not add task.');
    } finally {
      setAdding(false);
    }
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'completed' ? 'pending' : 'completed';
    setTodos(prev => prev.map(t => t._id === id ? { ...t, status: next } : t));
    try {
      await api.put(`/todos/${id}/status`, { status: next });
    } catch {
      fetchTodos(); // rollback
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Task', 'Remove this task permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setTodos(prev => prev.filter(t => t._id !== id));
          try { await api.delete(`/todos/${id}`); } catch { fetchTodos(); }
        }
      }
    ]);
  };

  const filtered = todos.filter(t => {
    if (filter === 'Pending') return t.status === 'pending';
    if (filter === 'Completed') return t.status === 'completed';
    return true;
  });
  const completedCount = todos.filter(t => t.status === 'completed').length;

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{todos.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: '#f59e0b' }]}>{todos.length - completedCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statNum, { color: '#16a34a' }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      {/* Add Bar */}
      <View style={styles.addBar}>
        <TextInput
          value={newTask}
          onChangeText={setNewTask}
          placeholder="Add a new task..."
          placeholderTextColor="#9ca3af"
          style={styles.addInput}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={handleAdd}
          disabled={adding || !newTask.trim()}
          style={[styles.addBtn, (!newTask.trim() || adding) && styles.addBtnDisabled]}
        >
          {adding ? <ActivityIndicator color="#fff" size="small" /> : <Plus color="#fff" size={20} />}
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <CalendarDays color="#d1d5db" size={48} />
          <Text style={styles.emptyTitle}>{filter !== 'All' ? `No ${filter.toLowerCase()} tasks` : 'No tasks yet'}</Text>
          <Text style={styles.emptySubtitle}>Add a task above to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.todoCard, item.status === 'completed' && styles.todoCardDone]}>
              <TouchableOpacity onPress={() => toggleStatus(item._id, item.status)} style={styles.checkBtn}>
                {item.status === 'completed'
                  ? <CheckCircle2 color="#16a34a" size={24} />
                  : <Circle color="#d1d5db" size={24} />
                }
              </TouchableOpacity>
              <Text style={[styles.todoText, item.status === 'completed' && styles.todoTextDone]}>
                {item.title}
              </Text>
              <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
                <Trash2 color="#fca5a5" size={18} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  statsBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: '#f1f5f9' },
  addBar: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  addInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: '#93c5fd' },
  filterRow: { flexDirection: 'row', gap: 8, padding: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  list: { padding: 12 },
  todoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9', gap: 12 },
  todoCardDone: { opacity: 0.6 },
  checkBtn: { padding: 2 },
  todoText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1f2937' },
  todoTextDone: { textDecorationLine: 'line-through', color: '#9ca3af' },
  deleteBtn: { padding: 6 },
});
