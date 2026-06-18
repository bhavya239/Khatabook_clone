import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import api from '../../lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

interface Summary {
  totalGiven: number;
  totalReceived: number;
  netBalance: number;
  contactCount: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary>({ totalGiven: 0, totalReceived: 0, netBalance: 0, contactCount: 0 });
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, txRes] = await Promise.all([
        api.get('/transactions/summary'),
        api.get('/transactions'),
      ]);

      const s = summaryRes.data.summary || {};
      setSummary({
        totalGiven: s.totalGiven || 0,
        totalReceived: s.totalReceived || 0,
        netBalance: (s.totalReceived || 0) - (s.totalGiven || 0),
        contactCount: summaryRes.data.contactBalances?.length || 0,
      });

      const txs = txRes.data.transactions || txRes.data.data || [];
      setRecentTx(txs.slice(0, 5));
    } catch (error) {
      console.error('Dashboard fetch failed', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const netPositive = summary.netBalance >= 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#2563eb" />}
    >
      {/* Hero Balance Card */}
      <View style={[styles.heroCard, { backgroundColor: netPositive ? '#1d4ed8' : '#be123c' }]}>
        <View style={styles.heroTop}>
          <Wallet color="rgba(255,255,255,0.8)" size={20} />
          <Text style={styles.heroLabel}>Net Ledger Balance</Text>
        </View>
        <Text style={styles.heroAmount}>
          {netPositive ? '+' : '-'}₹{Math.abs(summary.netBalance).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.heroSub}>
          {netPositive ? 'You are in a net credit position' : 'You are in a net debit position'}
        </Text>
        <View style={styles.heroDivider} />
        <Text style={styles.heroGreet}>Good day, {user?.name?.split(' ')[0] || 'User'} 👋</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardGive]}>
          <View style={styles.statIcon}>
            <TrendingUp color="#dc2626" size={18} />
          </View>
          <Text style={styles.statLabel}>You Will Give</Text>
          <Text style={[styles.statAmount, { color: '#dc2626' }]}>
            ₹{summary.totalGiven.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.statCard, styles.statCardGet]}>
          <View style={styles.statIcon}>
            <TrendingDown color="#16a34a" size={18} />
          </View>
          <Text style={styles.statLabel}>You Will Get</Text>
          <Text style={[styles.statAmount, { color: '#16a34a' }]}>
            ₹{summary.totalReceived.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentTx.length === 0 ? (
          <View style={styles.emptyBox}>
            <AlertCircle color="#d1d5db" size={32} />
            <Text style={styles.emptyText}>No transactions yet. Add a party and record entries.</Text>
          </View>
        ) : (
          recentTx.map(tx => (
            <View key={tx._id} style={styles.txRow}>
              <View style={[styles.txBadge, { backgroundColor: tx.type === 'give' ? '#fef2f2' : '#f0fdf4' }]}>
                <Text style={[styles.txBadgeText, { color: tx.type === 'give' ? '#dc2626' : '#16a34a' }]}>
                  {tx.type === 'give' ? 'DR' : 'CR'}
                </Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{tx.description || 'Transaction'}</Text>
                <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString('en-IN')}</Text>
              </View>
              <Text style={[styles.txAmt, { color: tx.type === 'give' ? '#dc2626' : '#16a34a' }]}>
                {tx.type === 'give' ? '-' : '+'}₹{tx.amount?.toLocaleString('en-IN')}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  heroCard: { borderRadius: 24, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  heroAmount: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 16 },
  heroGreet: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, borderWidth: 1 },
  statCardGive: { backgroundColor: '#fff', borderColor: '#fee2e2' },
  statCardGet: { backgroundColor: '#fff', borderColor: '#dcfce7' },
  statIcon: { marginBottom: 10 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  statAmount: { fontSize: 22, fontWeight: '800' },
  section: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  emptyBox: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  emptyText: { color: '#9ca3af', textAlign: 'center', fontSize: 14, lineHeight: 22 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  txBadge: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txBadgeText: { fontSize: 11, fontWeight: '800' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  txDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  txAmt: { fontSize: 16, fontWeight: '700' },
});
