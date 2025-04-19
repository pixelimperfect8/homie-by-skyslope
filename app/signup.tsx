import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import FormField from '@/components/FormField';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validatePassword, validateName } from '@/utils/validation';

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
    
    try {
      // Use demo@example.com as a demo account for testing
      if (email.trim().toLowerCase() === 'demo@example.com') {
        setName('Demo User');
        setEmail('demo@example.com');
        setPassword('password');
      }
      
      const { error } = await signUp(email.trim(), password, name.trim());
      if (error) {
        console.error('Signup error:', error);
        if (error.message?.includes('email')) {
          setErrorMessage('This email is already in use. Please log in or use a different email.');
        } else {
          setErrorMessage(error.message || 'Error creating account');
        }
      } else {
        setIsSuccess(true);
        
        // Navigate to onboarding after a short delay
        setTimeout(() => {
          router.replace('/onboarding');
        }, 1500);
      }
    } catch (error) {
      console.error('Unexpected signup error:', error);
      setErrorMessage('An unexpected error occurred. Please try again later.');
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
          <Text style={[styles.logo, { color: colors.primary }]}>Homie</Text>
          <Text style={[styles.tagline, { color: colors.text }]}>
            Your AI Real Estate Assistant
          </Text>
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
            placeholder="Enter your name"
            autoCapitalize="words"
            error={nameError}
          />
          
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            error={emailError}
          />
          
          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
            error={passwordError}
          />
          
          <Button
            title="Create Account"
            onPress={handleSignup}
            isLoading={isLoading}
            style={styles.button}
          />
          
          <TouchableOpacity onPress={handleUseDemoAccount} style={styles.demoButton}>
            <Text style={{ color: colors.primary, textAlign: 'center', fontWeight: '500' }}>
              Use Demo Account
            </Text>
          </TouchableOpacity>
          
          <View style={styles.loginContainer}>
            <Text style={{ color: colors.text }}>Already have an account? </Text>
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
  },
  demoButton: {
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
});