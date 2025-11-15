import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { ThemeProvider } from "../src/providers/ThemeProvider";
import { useAuthStore } from "../src/store/authStore";
import { initDatabase } from "../src/database";
import { ErrorBoundary } from "../src/components/errors/ErrorBoundary";
import { networkMonitor } from "../src/sync/NetworkMonitor";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayoutNav() {
  const segments = useSegments();
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Initialize database and check auth status
    const init = async () => {
      try {
        await initDatabase();
        networkMonitor.initialize();
        await checkAuthStatus();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      networkMonitor.cleanup();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup) {
      // Redirect to tabs if authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: "Modal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
