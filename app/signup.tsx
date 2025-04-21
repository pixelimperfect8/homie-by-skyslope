import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import FormField from '@/components/FormField';
import Button from '@/components/Button';
import Logo from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validatePassword, validateName } from '@/utils/validation';
import LogoImage from '../assets/images/logo.png';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validate = () => {
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setNameError(nameError);
    setEmailError(emailError);
    setPasswordError(passwordError);
    
    return !nameError && !emailError && !passwordError;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    
    setIsLoading(true);
    setErrorMessage('');
    setIsSuccess(false);
    
    try {
      const { error } = await signUp(email.trim(), password, name.trim());
      
      if (error) {
        // Use the specific error message from AuthContext
        setErrorMessage(error.message);
      } else {
        setIsSuccess(true);
        setErrorMessage('');
        
        // Navigate to onboarding after a short delay
        setTimeout(() => {
          router.replace('/onboarding');
        }, 1500);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'An unexpected error occurred during signup. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUseDemoAccount = () => {
    setName('Demo User');
    setEmail('demo@example.com');
    setPassword('password');
    
    // Auto-submit with slight delay to show the filled fields
    setTimeout(() => {
      handleSignup();
    }, 300);
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
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          
          {errorMessage ? (
            <Text style={[styles.errorMessage, { color: colors.error }]}>
              {errorMessage}
            </Text>
          ) : null}
          
          {isSuccess ? (
            <Text style={[styles.successMessage, { color: colors.success }]}>
              Account created successfully! Redirecting to onboarding...
            </Text>
          ) : null}
          
          <FormField
            label="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            error={nameError}
          />
          
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={emailError}
          />
          
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={passwordError}
          />
          
          <Button
            title="Create Account"
            onPress={handleSignup}
            isLoading={isLoading}
            style={styles.button}
          />
          
          <View style={styles.loginContainer}>
            <Text style={{ color: '#3F5B77' }}>Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  Log in
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
    marginTop: 60,
    marginBottom: 40,
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
  successMessage: {
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  }
});