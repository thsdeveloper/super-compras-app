import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ShoppingProvider } from '@/src/contexts/ShoppingContext';
import { GameProvider } from '@/src/contexts/GameContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GameProvider>
        <ShoppingProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="scanner" options={{ 
              title: 'Escanear Produto',
              presentation: 'modal'
            }} />
            <Stack.Screen name="shopping-list" options={{ 
              title: 'Lista de Compras'
            }} />
            <Stack.Screen name="product-details" options={{ 
              title: 'Detalhes do Produto',
              presentation: 'modal'
            }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ShoppingProvider>
      </GameProvider>
    </ThemeProvider>
  );
}
