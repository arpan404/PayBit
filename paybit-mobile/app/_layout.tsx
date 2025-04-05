import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreenLib from 'expo-splash-screen';
import { ThemeProvider as CustomThemeProvider } from '../context/ThemeContext';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import { CurrencyProvider } from '../context/CurrencyContext';

// Keep the splash screen visible while we fetch resources
SplashScreenLib.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    async function init() {
      if (loaded) {
        await SplashScreenLib.hideAsync();
      }
    }
    init();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <CustomThemeProvider>
      <CurrencyProvider>
        <Slot />
      </CurrencyProvider>
    </CustomThemeProvider>
  );
}
