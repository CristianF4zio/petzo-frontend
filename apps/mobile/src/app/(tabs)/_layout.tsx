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
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 12 },
        tabBarStyle: { backgroundColor: color.canvas, borderTopColor: color.hairline, borderTopWidth: 1, elevation: 0, shadowOpacity: 0 },
        tabBarItemStyle: { paddingTop: 4 },
        sceneStyle: { backgroundColor: color.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Explorar', tabBarIcon: ({ color: c, focused }) => <Compass size={24} color={c} strokeWidth={focused ? 2.4 : 2} /> }} />
      <Tabs.Screen name="publish" options={{ title: 'Publicar', tabBarIcon: ({ color: c, focused }) => <CirclePlus size={24} color={c} strokeWidth={focused ? 2.4 : 2} /> }} />
      <Tabs.Screen name="mine" options={{ title: 'Mis publicaciones', tabBarIcon: ({ color: c, focused }) => <LayoutList size={24} color={c} strokeWidth={focused ? 2.4 : 2} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color: c, focused }) => <CircleUser size={24} color={c} strokeWidth={focused ? 2.4 : 2} /> }} />
    </Tabs>
  );
}
