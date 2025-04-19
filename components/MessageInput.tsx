import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { Send } from 'lucide-react-native';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      style={styles.container}
    >
      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
        }
      ]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Message Homie..."
          placeholderTextColor={colors.muted}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          numberOfLines={5}
          editable={!disabled}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            (!message.trim() || disabled) && { opacity: 0.5 }
          ]}
          onPress={handleSend}
          disabled={!message.trim() || disabled}
          activeOpacity={0.7}
        >
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingTop: 8,
    paddingRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
});