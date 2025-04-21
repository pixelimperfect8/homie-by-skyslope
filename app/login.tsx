import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import FormField from '@/components/FormField';
import Button from '@/components/Button';
import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validatePassword } from '@/utils/validation';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validate = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setEmailError(emailError);
    setPasswordError(passwordError);
    
    return !emailError && !passwordError;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    // Trim inputs to prevent whitespace issues
    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await signIn(trimmedEmail, trimmedPassword);
      if (error) {
        // Use the specific error message from AuthContext
        setErrorMessage(error.message);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again later.');
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
          <Logo />
        </View>

        <View style={styles.form}>
          <Text style={[styles.title, { color: colors.text }]}>Welcome!</Text>
          
          {errorMessage ? (
            <Text style={[styles.errorMessage, { color: colors.error }]}>
              {errorMessage}
            </Text>
          ) : null}
          
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={emailError || undefined}
          />
          
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={passwordError}
          />
          
          <Link href="/forgot-password" asChild>
            <TouchableOpacity>
              <Text style={[styles.forgotPassword, { color: colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </Link>
          
          <Button
            title="Log In"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.button}
          />
          
          <View style={styles.signupContainer}>
            <Text style={{ color: '#3F5B77' }}>Don't have an account? </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  Sign up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
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
    marginTop: 30,
    marginBottom: 20,
  },
  form: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  errorMessage: {
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  forgotPassword: {
    textAlign: 'left',
    marginBottom: 24,
    fontSize: 14,
  },
  button: {
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  }
});