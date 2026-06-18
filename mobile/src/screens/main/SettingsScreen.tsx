import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  ActivityIndicator, StyleSheet, Alert
} from 'react-native';
import api from '../../lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, LogOut, ChevronRight, User, Phone, Mail } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, logout, lockApp, updateUser } = useAuth();
  const [autoLockEnabled, setAutoLockEnabled] = useState(!!(user?.autoLockTime && user?.autoLockTime > 0));
  const [savingLock, setSavingLock] = useState(false);

  const handleToggleAutoLock = async (val: boolean) => {
    setAutoLockEnabled(val);
    setSavingLock(true);
    try {
      await api.put('/auth/auto-lock', { time: val ? 60 : null });
      await updateUser({ autoLockTime: val ? 60 : null });
    } catch {
      setAutoLockEnabled(!val); // rollback
      Alert.alert('Error', 'Could not update auto-lock setting.');
    } finally {
      setSavingLock(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'End your session on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleLock = () => {
    Alert.alert('Lock App', 'Lock the app now? You will need your PIN to re-enter.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Lock', onPress: lockApp },
    ]);
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'U';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'User'}</Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIcon}><Phone color="#6b7280" size={18} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Phone</Text>
            <Text style={styles.rowValue}>{user?.phone || '—'}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.rowIcon}><Mail color="#6b7280" size={18} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{user?.email || 'Not set'}</Text>
          </View>
        </View>
      </View>

      {/* Security Section */}
      <Text style={styles.sectionLabel}>SECURITY</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: '#eff6ff' }]}>
            <Shield color="#2563eb" size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowValueBold}>Auto-Lock on Background</Text>
            <Text style={styles.rowLabel}>Require PIN when app goes to background</Text>
          </View>
          {savingLock
            ? <ActivityIndicator size="small" color="#2563eb" />
            : <Switch
                value={autoLockEnabled}
                onValueChange={handleToggleAutoLock}
                trackColor={{ false: '#e5e7eb', true: '#bfdbfe' }}
                thumbColor={autoLockEnabled ? '#2563eb' : '#9ca3af'}
              />
          }
        </View>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.row} onPress={handleLock} activeOpacity={0.7}>
          <View style={[styles.rowIcon, { backgroundColor: '#fff7ed' }]}>
            <Lock color="#f97316" size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowValueBold}>Lock App Now</Text>
            <Text style={styles.rowLabel}>Require PIN to re-enter immediately</Text>
          </View>
          <ChevronRight color="#d1d5db" size={18} />
        </TouchableOpacity>
      </View>

      {/* Danger Section */}
      <Text style={styles.sectionLabel}>SESSION</Text>
      <TouchableOpacity style={styles.dangerCard} onPress={handleLogout} activeOpacity={0.7}>
        <View style={[styles.rowIcon, { backgroundColor: '#fef2f2' }]}>
          <LogOut color="#dc2626" size={18} />
        </View>
        <Text style={styles.dangerText}>Sign Out</Text>
        <ChevronRight color="#fca5a5" size={18} />
      </TouchableOpacity>

      <Text style={styles.version}>Khatabook Mobile v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 48 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, gap: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  avatarLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 6 },
  rolePill: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '500', marginTop: 2 },
  rowValue: { fontSize: 15, color: '#374151', fontWeight: '600' },
  rowValueBold: { fontSize: 15, color: '#111827', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 64 },
  dangerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#fee2e2', marginBottom: 32 },
  dangerText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#dc2626' },
  version: { textAlign: 'center', fontSize: 12, color: '#d1d5db', fontWeight: '500' },
});
