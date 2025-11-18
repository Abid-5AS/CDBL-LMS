import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { ThemeProvider } from "@/src/providers/ThemeProvider";
import { useAuthStore } from "../src/store/authStore";
import { initDatabase } from "../src/database";
import { ErrorBoundary } from "../src/components/errors/ErrorBoundary";
import { networkMonitor } from "../src/sync/NetworkMonitor";
import { notificationService } from "../src/notifications/NotificationService";

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
        await notificationService.initialize();
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

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedRoute = segments[0] === '(tabs)' ||
                             segments[0] === 'settings' ||
                             segments[0] === 'profile' ||
                             segments[0] === 'ai-assistant' ||
                             segments[0] === 'approvals' ||
                             segments[0] === 'admin' ||
                             segments[0] === 'reports';

    // Force redirect to login if not authenticated and trying to access protected routes
    if (!isAuthenticated && inProtectedRoute) {
      console.log('🔒 Not authenticated, redirecting to login');
      router.replace('/(auth)/login');
    }
    // Redirect to tabs if authenticated and on auth screens
    else if (isAuthenticated && inAuthGroup) {
      console.log('✅ Already authenticated, redirecting to home');
      router.replace('/(tabs)');
    }
    // If not authenticated and not in any protected route, redirect to login
    else if (!isAuthenticated && segments.length === 0) {
      console.log('🔒 No route, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: "Modal" }}
      />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="ai-assistant" options={{ headerShown: false }} />
      <Stack.Screen name="approvals/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="admin/users/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="reports/index"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
