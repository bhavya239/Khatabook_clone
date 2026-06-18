import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, KeyboardAvoidingView,
  Platform, TextInput, ActivityIndicator, ScrollView, StyleSheet, Alert
} from 'react-native';
import api from '../../lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowUpRight, ArrowDownRight, Plus, X, ChevronLeft } from 'lucide-react-native';

export default function ContactDetailScreen({ route, navigation }: any) {
  const { contact } = route.params;
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [txType, setTxType] = useState<'given' | 'received'>('received');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txError, setTxError] = useState('');
  const [balance, setBalance] = useState(0);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', { params: { contactId: contact._id } });
      const txs = res.data.transactions || res.data.data || [];
      setTransactions(txs);
      let bal = 0;
      txs.forEach((t: any) => { if (t.type === 'received') bal += t.amount; else bal -= t.amount; });
      setBalance(bal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchTransactions(); }, []));

  const handleAddTx = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setTxError('Enter a valid positive amount.');
      return;
    }
    setTxError('');
    setSubmitting(true);
    try {
      await api.post('/transactions', {
        contact: contact._id,
        type: txType,
        amount: Number(amount),
        description: description.trim() || (txType === 'given' ? 'Amount given' : 'Amount received'),
      });
      setShowModal(false);
      setAmount('');
      setDescription('');
      fetchTransactions();
    } catch (err: any) {
      setTxError(err.response?.data?.message || 'Transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTx = (id: string) => {
    Alert.alert('Delete Entry', 'Remove this ledger entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/transactions/${id}`);
            fetchTransactions();
          } catch { Alert.alert('Error', 'Could not delete entry.'); }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Contact Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{contact.name?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.contactPhone}>{contact.phone}</Text>
        </View>
        <View style={[styles.balancePill, { backgroundColor: balance >= 0 ? '#f0fdf4' : '#fef2f2' }]}>
          <Text style={[styles.balanceText, { color: balance >= 0 ? '#16a34a' : '#dc2626' }]}>
            {balance >= 0 ? 'Gets' : 'Gives'} ₹{Math.abs(balance).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.giveBtn]} onPress={() => { setTxType('given'); setShowModal(true); }}>
          <ArrowUpRight color="#fff" size={18} />
          <Text style={styles.actionText}>You Gave</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.getBtn]} onPress={() => { setTxType('received'); setShowModal(true); }}>
          <ArrowDownRight color="#fff" size={18} />
          <Text style={styles.actionText}>You Got</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptySubtitle}>Tap "You Gave" or "You Got" to add the first entry.</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onLongPress={() => handleDeleteTx(item._id)} activeOpacity={0.8} style={styles.txCard}>
              <View style={[styles.txBadge, { backgroundColor: item.type === 'given' ? '#fef2f2' : '#f0fdf4' }]}>
                {item.type === 'given' ? <ArrowUpRight color="#dc2626" size={18} /> : <ArrowDownRight color="#16a34a" size={18} />}
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{item.description}</Text>
                <Text style={styles.txDate}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
              <Text style={[styles.txAmount, { color: item.type === 'given' ? '#dc2626' : '#16a34a' }]}>
                {item.type === 'given' ? '-' : '+'}₹{item.amount?.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => { setTxType('received'); setShowModal(true); }}>
        <Plus color="#fff" size={26} />
      </TouchableOpacity>

      {/* Transaction Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrap}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.mHeader}>
              <View>
                <Text style={styles.mTitle}>Record Entry</Text>
                <Text style={styles.mSubtitle}>For {contact.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <X color="#6b7280" size={22} />
              </TouchableOpacity>
            </View>

            {/* Type Tabs */}
            <View style={styles.typeTabs}>
              <TouchableOpacity
                onPress={() => setTxType('given')}
                style={[styles.typeTab, txType === 'given' && styles.typeTabActiveGive]}
              >
                <Text style={[styles.typeTabText, txType === 'given' && { color: '#dc2626', fontWeight: '700' }]}>You Gave (DR)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTxType('received')}
                style={[styles.typeTab, txType === 'received' && styles.typeTabActiveGet]}
              >
                <Text style={[styles.typeTabText, txType === 'received' && { color: '#16a34a', fontWeight: '700' }]}>You Got (CR)</Text>
              </TouchableOpacity>
            </View>

            {!!txError && <View style={styles.errorBox}><Text style={styles.errorText}>{txError}</Text></View>}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Amount (₹)</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#9ca3af"
                style={[styles.amountInput, { color: txType === 'given' ? '#dc2626' : '#16a34a' }]}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Note (optional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What was this for?"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              onPress={handleAddTx}
              disabled={submitting}
              style={[styles.submitBtn, { backgroundColor: txType === 'given' ? '#dc2626' : '#16a34a' }, submitting && { opacity: 0.6 }]}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save Entry</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#2563eb' },
  contactName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  contactPhone: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  balancePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  balanceText: { fontSize: 13, fontWeight: '700' },
  actionRow: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  giveBtn: { backgroundColor: '#dc2626' },
  getBtn: { backgroundColor: '#16a34a' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 22 },
  list: { padding: 12 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  txBadge: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  txDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  txAmount: { fontSize: 17, fontWeight: '800' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, gap: 16 },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  mSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  closeBtn: { padding: 6 },
  typeTabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, gap: 4 },
  typeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  typeTabActiveGive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#fecaca' },
  typeTabActiveGet: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#bbf7d0' },
  typeTabText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { color: '#dc2626', fontSize: 13 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  amountInput: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 32, fontWeight: '800' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  submitBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
