import React, { useRef, useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';

interface OtpModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => Promise<void>;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export default function OtpModal({
  visible,
  onClose,
  onSubmit,
  title = "Enter Security Code",
  description = "A 6-digit OTP has been sent securely.",
  isLoading = false
}: OtpModalProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Reset entirely on mount
  useEffect(() => {
    if (visible) {
      setOtp(Array(6).fill(''));
      setError(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [visible]);

  if (!visible) return null;

  const handleChange = (text: string, index: number) => {
    if (/[^0-9]/.test(text)) return; // Only numeric allows natively
    
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1); // Guarantee single digit
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please fill all 6 digits.');
      return;
    }
    setError(null);
    try {
      await onSubmit(code);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/60 items-center justify-center p-4"
      >
        <View className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">{title}</Text>
          <Text className="text-sm text-gray-500 text-center mb-6">{description}</Text>

          {/* Core OTP Input Blocks */}
          <View className="flex-row justify-between mb-6">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                editable={!isLoading}
                className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            ))}
          </View>

          {error && (
            <View className="bg-red-50 p-2 rounded-lg border border-red-100 mb-4">
              <Text className="text-sm text-red-600 text-center">{error}</Text>
            </View>
          )}

          <View className="space-y-3 gap-3">
            <TouchableOpacity
              onPress={submitOtp}
              disabled={isLoading || otp.join('').length < 6}
              className={`w-full py-3 rounded-lg flex-row justify-center items-center ${
                isLoading || otp.join('').length < 6 ? 'bg-blue-400' : 'bg-blue-600'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" className="mr-2" />
              ) : (
                <Text className="text-white font-medium text-center">Verify & Submit</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onClose}
              disabled={isLoading}
              className="w-full py-3 rounded-lg border border-gray-200 bg-white"
            >
              <Text className="text-gray-600 font-medium text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
