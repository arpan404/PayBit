import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface QRButtonProps {
  color: string;
  size: number;
}

const QRButton = ({ color, size }: QRButtonProps) => (
  <View style={styles.qrButtonContainer}>
    <View style={styles.qrButtonBackground}>

      <Ionicons name="qr-code" size={size + 12} color="#FFFFFF" />
    </View>
  </View>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F7931A',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#333333',
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
          paddingTop: 5,
          position: 'absolute',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8
        },
        tabBarShowLabel: false,
        headerShown: false,
        tabBarItemStyle: {
          paddingVertical: 8
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size + 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="send-receive"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-vertical" size={size + 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ color, size }) => <QRButton color={color} size={size - 10} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size + 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size + 2} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  qrButtonContainer: {
    height: 60,
    width: 60,
    marginBottom: 15,
  },
  qrButtonBackground: {
    height: 60,
    width: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F7931A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
