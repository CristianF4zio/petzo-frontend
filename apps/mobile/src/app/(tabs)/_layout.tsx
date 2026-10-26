import { Tabs, router } from 'expo-router';
import { CirclePlus, CircleUser, Compass, LayoutList, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSession } from '@/lib/session';
import { color, font, radius } from '@/lib/theme';

// Active tab: brand icon on a brandSoft pill, ink label
const icon =
  (Icon: LucideIcon) =>
  ({ focused }: { focused: boolean }) => (
    <View style={[styles.pill, focused && { backgroundColor: color.brandSoft }]}>
      <Icon size={22} color={focused ? color.brand : color.muted} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );

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
        tabBarActiveTintColor: color.ink,
        tabBarInactiveTintColor: color.muted,
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 12, marginTop: 4 },
        tabBarStyle: { backgroundColor: color.canvas, borderTopColor: color.hairline, borderTopWidth: 1, elevation: 0, shadowOpacity: 0 },
        tabBarItemStyle: { paddingTop: 6 },
        sceneStyle: { backgroundColor: color.cream },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Explorar', tabBarIcon: icon(Compass) }} />
      <Tabs.Screen name="publish" options={{ title: 'Publicar', tabBarIcon: icon(CirclePlus) }} />
      <Tabs.Screen name="mine" options={{ title: 'Mis publicaciones', tabBarIcon: icon(LayoutList) }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon(CircleUser) }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: { width: 56, height: 30, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
