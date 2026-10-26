import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, useFonts } from '@expo-google-fonts/dm-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Splash } from '@/components/Splash';
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

function App() {
  const [fontsLoaded] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });
  const { ready } = useSession();
  const [splash, setSplash] = useState(true);
  const hide = useCallback(() => setSplash(false), []);
  return (
    <>
      {fontsLoaded ? <Routes /> : null}
      {/* light icons over the blue splash; the root "dark" one comes back when it unmounts */}
      {splash ? <StatusBar style="light" /> : null}
      {splash ? <Splash fonts={fontsLoaded} ready={fontsLoaded && ready} onDone={hide} /> : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <ToastProvider>
        <StatusBar style="dark" />
        <App />
      </ToastProvider>
    </SessionProvider>
  );
}
