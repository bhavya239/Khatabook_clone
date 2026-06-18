import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { type: 'give' | 'receive'; amount: number; description: string }) => Promise<void>;
  contactName?: string;
}

export default function TransactionModal({ visible, onClose, onSubmit, contactName = 'Unknown' }: TransactionModalProps) {
  const [type, setType] = useState<'give' | 'receive'>('receive');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitTx = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid positive amount.');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      await onSubmit({ type, amount: Number(amount), description });
      setAmount('');
      setDescription('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Transaction recording failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/50 justify-end"
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        
        <View className="bg-white rounded-t-3xl pt-6 px-6 pb-12 shadow-xl shadow-black">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-xl font-bold text-gray-900">Record Transaction</Text>
              <Text className="text-sm text-gray-500 mt-1">Ledger entry for {contactName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
               <X color="#4b5563" size={24} />
            </TouchableOpacity>
          </View>

          {/* Tab Toggles */}
          <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
             <TouchableOpacity 
                onPress={() => setType('give')}
                className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${type === 'give' ? 'bg-white shadow-sm border border-gray-200' : ''}`}
             >
                <Text className={`font-semibold ${type === 'give' ? 'text-red-600' : 'text-gray-500'}`}>You Gave (DR)</Text>
             </TouchableOpacity>
             <TouchableOpacity 
                onPress={() => setType('receive')}
                className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${type === 'receive' ? 'bg-white shadow-sm border border-gray-200' : ''}`}
             >
                <Text className={`font-semibold ${type === 'receive' ? 'text-green-600' : 'text-gray-500'}`}>You Got (CR)</Text>
             </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" scrollEnabled={false}>
            {error ? (
              <View className="bg-red-50 p-3 rounded-xl border border-red-100 mb-4">
                <Text className="text-sm text-red-600 text-center font-medium">{error}</Text>
              </View>
            ) : null}

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Amount (₹)</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                className={`bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-2xl font-bold ${type === 'give' ? 'text-red-600 focus:border-red-500 focus:ring-red-100' : 'text-green-600 focus:border-green-500 focus:ring-green-100'}`}
              />
            </View>
            
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Description (Optional)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What was this for?"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800 focus:border-blue-500"
              />
            </View>

            <TouchableOpacity 
              onPress={submitTx}
              disabled={loading}
              className={`w-full py-4 rounded-xl flex-row justify-center items-center ${
                loading ? 'bg-blue-400' : type === 'give' ? 'bg-red-600' : 'bg-green-600'
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" className="mr-2" />
              ) : (
                <Text className="text-white font-bold text-lg">Save Ledger Entry</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
