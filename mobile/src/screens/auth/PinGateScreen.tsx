import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Lock, Delete } from 'lucide-react-native';

export default function PinGateScreen() {
  const { verifyPinAndUnlock, logout, user } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (pin.length === 6 && !loading) {
      handleUnlock(pin);
    }
  }, [pin]);

  const handleUnlock = async (currentPin: string) => {
    setLoading(true);
    setError('');
    const success = await verifyPinAndUnlock(currentPin);
    if (!success) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(`Incorrect PIN${newAttempts >= 3 ? ' — ' + (5 - newAttempts) + ' attempts left' : ''}`);
      setPin('');
    }
    setLoading(false);
  };

  const handleKey = (key: string) => {
    if (loading || pin.length >= 6) return;
    setError('');
    setPin(prev => prev + key);
  };

  const handleDelete = () => {
    if (loading) return;
    setError('');
    setPin(prev => prev.slice(0, -1));
  };

  const dialKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <View style={styles.container}>
      {/* Identity */}
      <View style={styles.topSection}>
        <View style={styles.iconBg}>
          <Lock color="#3b82f6" size={36} />
        </View>
        <Text style={styles.greeting}>Welcome back</Text>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.subtitle}>Enter your 6-digit PIN to unlock</Text>
      </View>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <View key={i} style={[styles.dot, i < pin.length ? styles.dotFilled : styles.dotEmpty]} />
        ))}
      </View>

      {/* Error / Loading */}
      <View style={styles.feedbackArea}>
        {loading ? (
          <ActivityIndicator color="#3b82f6" />
        ) : !!error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </View>

      {/* Dialpad */}
      <View style={styles.dialpad}>
        {dialKeys.map((row, ri) => (
          <View key={ri} style={styles.dialRow}>
            {row.map(key => (
              <TouchableOpacity key={key} onPress={() => handleKey(key)} style={styles.dialKey} activeOpacity={0.6}>
                <Text style={styles.dialKeyText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.dialRow}>
          <TouchableOpacity onPress={logout} style={styles.dialKeyGhost} activeOpacity={0.6}>
            <Text style={styles.dialKeyGhostText}>Exit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleKey('0')} style={styles.dialKey} activeOpacity={0.6}>
            <Text style={styles.dialKeyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.dialKeyGhost} activeOpacity={0.6}>
            <Delete color="#9ca3af" size={22} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  topSection: { alignItems: 'center', marginBottom: 40 },
  iconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  greeting: { fontSize: 16, color: '#94a3b8', marginBottom: 4 },
  name: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b' },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  dotFilled: { backgroundColor: '#3b82f6' },
  dotEmpty: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#475569' },
  feedbackArea: { height: 28, marginBottom: 32, justifyContent: 'center' },
  errorText: { color: '#f87171', fontWeight: '600', fontSize: 14 },
  dialpad: { width: '80%', gap: 16 },
  dialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dialKey: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  dialKeyText: { fontSize: 28, fontWeight: '400', color: '#f1f5f9' },
  dialKeyGhost: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  dialKeyGhostText: { fontSize: 15, color: '#64748b', fontWeight: '600' },
});
