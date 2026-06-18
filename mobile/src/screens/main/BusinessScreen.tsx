import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Alert
} from 'react-native';
import api from '../../lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Building2, Plus, Users, CheckCircle2, Circle } from 'lucide-react-native';

export default function BusinessScreen() {
  const { user, updateUser } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/business/me');
      setBusinesses(res.data.businesses || []);
    } catch (err) {
      console.error('Business fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchBusinesses(); }, []));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post('/business/create', { name: newName.trim() });
      setNewName('');
      await fetchBusinesses();
      Alert.alert('Success', 'Business profile created!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not create business.');
    } finally {
      setCreating(false);
    }
  };

  const handleSwitch = async (id: string, name: string) => {
    if (user?.businessId === id) return;
    try {
      const res = await api.post(`/business/switch/${id}`);
      await updateUser({ businessId: id });
      Alert.alert('Switched', `Now operating as "${name}"`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Could not switch context.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Active Badge */}
      {user?.businessId && (
        <View style={styles.activeBanner}>
          <CheckCircle2 color="#16a34a" size={18} />
          <Text style={styles.activeBannerText}>Business Mode Active</Text>
        </View>
      )}

      {/* Create Section */}
      <View style={styles.createSection}>
        <Text style={styles.createTitle}>Register New Entity</Text>
        <View style={styles.createRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Business name..."
            placeholderTextColor="#9ca3af"
            style={styles.createInput}
            onSubmitEditing={handleCreate}
            returnKeyType="done"
          />
          <TouchableOpacity
            onPress={handleCreate}
            disabled={creating || !newName.trim()}
            style={[styles.createBtn, (!newName.trim() || creating) && styles.createBtnDisabled]}
          >
            {creating ? <ActivityIndicator color="#fff" size="small" /> : <Plus color="#fff" size={20} />}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionLabel}>YOUR ORGANIZATIONS</Text>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>
      ) : businesses.length === 0 ? (
        <View style={styles.emptyState}>
          <Building2 color="#d1d5db" size={48} />
          <Text style={styles.emptyTitle}>No businesses yet</Text>
          <Text style={styles.emptySubtitle}>Create a business entity above to enable multi-user Business Mode.</Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isActive = user?.businessId === item._id;
            return (
              <TouchableOpacity
                onPress={() => handleSwitch(item._id, item.name)}
                disabled={isActive}
                style={[styles.bizCard, isActive && styles.bizCardActive]}
                activeOpacity={0.7}
              >
                <View style={[styles.bizIcon, { backgroundColor: isActive ? '#4f46e5' : '#f1f5f9' }]}>
                  <Building2 color={isActive ? '#fff' : '#9ca3af'} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bizName, isActive && { color: '#4f46e5' }]}>{item.name}</Text>
                  <Text style={styles.bizRole}>{item.role === 'owner' ? 'Administrator' : 'Staff Member'}</Text>
                </View>
                {isActive
                  ? <View style={styles.activePill}><Text style={styles.activePillText}>Active</Text></View>
                  : <Text style={styles.switchText}>Switch</Text>
                }
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  activeBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', padding: 12, borderBottomWidth: 1, borderBottomColor: '#bbf7d0' },
  activeBannerText: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
  createSection: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 10 },
  createTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  createRow: { flexDirection: 'row', gap: 10 },
  createInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  createBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  createBtnDisabled: { backgroundColor: '#a5b4fc' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.2, margin: 16, marginBottom: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 22 },
  list: { paddingHorizontal: 16 },
  bizCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, gap: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  bizCardActive: { borderColor: '#c7d2fe', backgroundColor: '#fafafe' },
  bizIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bizName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 3 },
  bizRole: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  activePill: { backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activePillText: { color: '#4f46e5', fontWeight: '700', fontSize: 12 },
  switchText: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
});
