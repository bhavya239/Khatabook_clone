import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, Alert
} from 'react-native';
import api from '../../lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { Search, Plus, User, X, ChevronRight } from 'lucide-react-native';

export default function ContactsScreen({ navigation }: any) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchContacts = async () => {
    try {
      const res = await api.get('/contacts');
      setContacts(res.data.contacts || res.data.data || []);
    } catch (err) {
      console.error('Contacts fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchContacts(); }, []));

  const filtered = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const handleAdd = async () => {
    if (!newName.trim()) { setAddError('Name is required.'); return; }
    if (!newPhone.trim() || newPhone.trim().length < 10) { setAddError('Enter a valid phone number.'); return; }
    setAddError('');
    setAdding(true);
    try {
      await api.post('/contacts', { name: newName.trim(), phone: newPhone.trim() });
      setShowModal(false);
      setNewName('');
      setNewPhone('');
      fetchContacts();
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Failed to add contact.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remove Party', `Remove "${name}" from your ledger?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/contacts/${id}`);
            setContacts(prev => prev.filter(c => c._id !== id));
          } catch { Alert.alert('Error', 'Could not remove contact.'); }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search color="#9ca3af" size={18} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search party name or phone..."
            placeholderTextColor="#9ca3af"
            style={styles.searchText}
          />
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
          <Plus color="#fff" size={22} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><User color="#93c5fd" size={36} /></View>
          <Text style={styles.emptyTitle}>{search ? 'No results found' : 'No parties yet'}</Text>
          <Text style={styles.emptySubtitle}>{search ? 'Try a different name or number.' : 'Add a customer or supplier to start tracking.'}</Text>
          {!search && (
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.emptyAddBtn}>
              <Text style={styles.emptyAddText}>Add First Party</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchContacts} tintColor="#2563eb" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => navigation.navigate('ContactDetail', { contact: item })}
              onLongPress={() => handleDelete(item._id, item.name)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactPhone}>{item.phone}</Text>
              </View>
              <View style={styles.contactMeta}>
                {item.balance !== undefined && (
                  <Text style={[styles.balance, { color: item.balance >= 0 ? '#16a34a' : '#dc2626' }]}>
                    {item.balance >= 0 ? '+' : ''}₹{Math.abs(item.balance || 0).toLocaleString('en-IN')}
                  </Text>
                )}
                <ChevronRight color="#d1d5db" size={16} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add Contact Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Party</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <X color="#6b7280" size={22} />
              </TouchableOpacity>
            </View>
            {!!addError && <View style={styles.errorBox}><Text style={styles.errorText}>{addError}</Text></View>}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Party Name</Text>
              <TextInput value={newName} onChangeText={setNewName} placeholder="e.g. Ramesh Kumar" placeholderTextColor="#9ca3af" style={styles.input} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" placeholder="10-digit mobile" placeholderTextColor="#9ca3af" style={styles.input} />
            </View>
            <TouchableOpacity onPress={handleAdd} disabled={adding} style={[styles.submitBtn, adding && styles.submitBtnDisabled]}>
              {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Add Party</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchText: { flex: 1, fontSize: 15, color: '#111827' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
  emptyAddBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#2563eb', borderRadius: 12 },
  emptyAddText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { padding: 12 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#2563eb' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  contactPhone: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  contactMeta: { alignItems: 'flex-end', gap: 4 },
  balance: { fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  closeBtn: { padding: 4 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#dc2626', fontSize: 13, fontWeight: '500' },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#93c5fd' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
