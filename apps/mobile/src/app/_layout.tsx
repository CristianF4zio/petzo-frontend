import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, useFonts } from '@expo-google-fonts/dm-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider, useSession } from '@/lib/session';
import { color } from '@/lib/theme';
import { ToastProvider } from '@/lib/toast';

function Routes() {
  const { ready, session } = useSession();
  if (!ready) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.canvas } }}>
      {/* without redirectTo the router falls back to GO_BACK, which has nowhere to go on launch */}
      <Stack.Protected guard={!!session} redirectTo="/welcome">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pet/[id]" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="requests/[petId]" />
        <Stack.Screen name="my-requests" />
        <Stack.Screen name="match" />
        <Stack.Screen name="profile-setup" />
      </Stack.Protected>
      <Stack.Protected guard={!session} redirectTo="/">
        <Stack.Screen name="welcome" />
        <Stack.Screen name="auth" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });
  if (!fontsLoaded) return null;
  return (
    <SessionProvider>
      <ToastProvider>
        <StatusBar style="dark" />
        <Routes />
      </ToastProvider>
    </SessionProvider>
  );
}
