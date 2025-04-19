import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import FormField from '@/components/FormField';
import Button from '@/components/Button';
import { LogOut, ChevronRight, Moon, Bell, Key, Chrome as Home, Sun } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, signOut, updateUserType } = useAuth();
  const { colorScheme, isDarkMode, toggleDarkMode } = useTheme();
  const colors = Colors[colorScheme];
  
  const [name, setName] = useState(user?.name || '');
  const [editingProfile, setEditingProfile] = useState(false);
  const [notifications, setNotifications] = useState(true);
  
  const handleSaveProfile = () => {
    // Update profile logic would go here
    setEditingProfile(false);
    Alert.alert('Success', 'Profile updated successfully');
  };
  
  const handleChangeUserType = async () => {
    if (!user || !user.user_type) return;
    
    const newType = user.user_type === 'buyer' ? 'owner' : 'buyer';
    await updateUserType(newType);
    Alert.alert('Success', `Changed to ${newType === 'buyer' ? 'Home Buyer' : 'Home Owner'}`);
  };
  
  const renderProfileSection = () => {
    if (editingProfile) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Edit Profile</Text>
          
          <FormField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
          />
          
          <View style={styles.editButtons}>
            <Button
              title="Cancel"
              onPress={() => setEditingProfile(false)}
              variant="secondary"
              style={{ flex: 1, marginRight: 8 }}
            />
            
            <Button
              title="Save"
              onPress={handleSaveProfile}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>
        
        <View style={[styles.profileInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.secondary }]}>{user?.email}</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => setEditingProfile(true)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {renderProfileSection()}
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={handleChangeUserType}
          >
            <View style={styles.settingLeft}>
              {user?.user_type === 'buyer' ? (
                <Key size={22} color={colors.primary} />
              ) : (
                <Home size={22} color={colors.primary} />
              )}
              <Text style={[styles.settingText, { color: colors.text }]}>
                User Type: {user?.user_type === 'buyer' ? 'Home Buyer' : 'Home Owner'}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.secondary} />
          </TouchableOpacity>
          
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingLeft}>
              {isDarkMode ? (
                <Moon size={22} color={colors.primary} />
              ) : (
                <Sun size={22} color={colors.primary} />
              )}
              <Text style={[styles.settingText, { color: colors.text }]}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          </View>
          
          <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <Bell size={22} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Button
            title="Log Out"
            onPress={signOut}
            variant="outline"
            style={styles.logoutButton}
            textStyle={{ color: colors.error }}
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.secondary }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    borderColor: '#FF3B30',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});