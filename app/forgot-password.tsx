import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import FormField from '@/components/FormField';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const validate = () => {
    const emailError = validateEmail(email);
    setEmailError(emailError);
    return !emailError;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const { error } = await resetPassword(email);
      if (error) {
        setErrorMessage(error.message || 'Error sending reset email');
      } else {
        setSuccessMessage('Password reset email sent! Check your inbox.');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary }]}>Homie</Text>
          <Text style={[styles.tagline, { color: colors.text }]}>
            Your AI Real Estate Assistant
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          
          {errorMessage ? (
            <Text style={[styles.errorMessage, { color: colors.error }]}>
              {errorMessage}
            </Text>
          ) : null}
          
          {successMessage ? (
            <Text style={[styles.successMessage, { color: colors.success }]}>
              {successMessage}
            </Text>
          ) : null}
          
          <Text style={[styles.description, { color: colors.text }]}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
          
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            error={emailError}
          />
          
          <Button
            title="Send Reset Link"
            onPress={handleResetPassword}
            isLoading={isLoading}
            style={styles.button}
          />
          
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Text style={{ color: colors.primary, textAlign: 'center' }}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
  },
  form: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
  errorMessage: {
    marginBottom: 16,
    fontSize: 14,
  },
  successMessage: {
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
  },
});