<<<<<<< HEAD
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
=======
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SplashScreen } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreenLib from 'expo-splash-screen';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
>>>>>>> 511b7396cac74187a96d7f5b881ef293d4ab047f

import { useColorScheme } from "@/hooks/useColorScheme";

// Keep the splash screen visible while we fetch resources
SplashScreenLib.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreenLib.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
<<<<<<< HEAD
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
=======
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="profile"
            options={{
              headerShown: true,
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#121212',
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                color: '#FFFFFF',
              },
            }}
          />
          <Stack.Screen
            name="change-password"
            options={{
              headerShown: true,
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#121212',
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                color: '#FFFFFF',
              },
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: true,
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#121212',
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                color: '#FFFFFF',
              },
            }}
          />
          <Stack.Screen
            name="security"
            options={{
              headerShown: true,
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#121212',
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                color: '#FFFFFF',
              },
            }}
          />
          <Stack.Screen
            name="help-support"
            options={{
              headerShown: true,
              headerBackTitle: 'Back',
              headerStyle: {
                backgroundColor: '#121212',
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                color: '#FFFFFF',
              },
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </View>
>>>>>>> 511b7396cac74187a96d7f5b881ef293d4ab047f
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
