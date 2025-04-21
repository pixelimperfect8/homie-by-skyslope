import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Image, View, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { usePathname } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const pathname = usePathname();

  const isChatsScreen = pathname === '/chat';

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#033291',
          tabBarInactiveTintColor: '#AFBECD',
          tabBarStyle: {
            height: 70,
            paddingTop: 8,
            paddingBottom: 0,
            borderTopWidth: 0,
            backgroundColor: '#FFFFFF',
            ...(isChatsScreen ? {} : {
              shadowColor: 'rgb(5, 52, 145)',
              shadowOffset: {
                width: 0,
                height: -4,
              },
              shadowOpacity: 0.08,
              shadowRadius: 41.6,
              elevation: 20,
            }),
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            marginTop: 0,
            marginBottom: 0,
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
          headerShown: false,
        }}>
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ focused }) => (
              <Image
                key={focused ? 'chat-active' : 'chat-inactive'}
                source={focused ? require('@/assets/images/chat-active.png') : require('@/assets/images/chat-inactive.png')}
                style={{ width: 24, height: 24 }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ focused }) => (
              <Image
                key={focused ? 'progress-active' : 'progress-inactive'}
                source={focused ? require('@/assets/images/timeline-active.png') : require('@/assets/images/timeline-inactive.png')}
                style={{ width: 24, height: 24 }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="resources"
          options={{
            title: 'Resources',
            tabBarIcon: ({ focused }) => (
              <Image
                key={focused ? 'resources-active' : 'resources-inactive'}
                source={focused ? require('@/assets/images/resources.png') : require('@/assets/images/resources-inactive.png')}
                style={{ width: 24, height: 24 }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused }) => (
              <Image
                key={focused ? 'settings-active' : 'settings-inactive'}
                source={focused ? require('@/assets/images/settings-active.png') : require('@/assets/images/settings-inactive.png')}
                style={{ width: 24, height: 24 }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});