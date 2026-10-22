import { Tabs, router } from 'expo-router';
import { CirclePlus, CircleUser, Compass, LayoutList } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { useSession } from '@/lib/session';
import { color, font } from '@/lib/theme';

export default function TabsLayout() {
  const { profile, isComplete } = useSession();
  // Design: after the first sign-in, ask for zone and WhatsApp once; the user may skip and browse
  const asked = useRef(false);
  useEffect(() => {
    if (profile && !isComplete && !asked.current) {
      asked.current = true;
      router.push('/profile-setup');
    }
  }, [profile, isComplete]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.brand,
        tabBarInactiveTintColor: color.muted,
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 13 },
        tabBarStyle: { borderTopColor: color.hairline },
        sceneStyle: { backgroundColor: color.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Explorar', tabBarIcon: ({ color: c }) => <Compass size={24} color={c} /> }} />
      <Tabs.Screen name="publish" options={{ title: 'Publicar', tabBarIcon: ({ color: c }) => <CirclePlus size={24} color={c} /> }} />
      <Tabs.Screen name="mine" options={{ title: 'Mis publicaciones', tabBarIcon: ({ color: c }) => <LayoutList size={24} color={c} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color: c }) => <CircleUser size={24} color={c} /> }} />
    </Tabs>
  );
}
