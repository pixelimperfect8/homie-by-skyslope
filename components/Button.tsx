import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.card,
          borderColor: colors.border,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          borderWidth: 1,
        };
      case 'primary':
      default:
        return {
          width: '100%' as const,
          height: 48,
          borderRadius: 24,
          
          paddingHorizontal: 24,
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          color: colors.text,
        };
      case 'outline':
        return {
          color: colors.primary,
        };
      case 'primary':
      default:
        return {
          color: 'white',
          fontWeight: '600' as const,
        };
    }
  };

  const renderButtonContent = () => (
    <>
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : colors.primary} />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          getButtonStyle(),
          disabled || isLoading ? { opacity: 0.7 } : {},
          style,
        ]}
        onPress={onPress}
        disabled={disabled || isLoading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#43D4FF', '#533DB1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {renderButtonContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        disabled || isLoading ? { opacity: 0.7 } : {},
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {renderButtonContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    height: 48,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    height: '100%',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});