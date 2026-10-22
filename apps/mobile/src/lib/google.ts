import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

// Returns false when the user closes the browser; throws on real errors
export async function signInWithGoogle() {
  // exp://<ip>:8081/--/ in Expo Go, petzo:/// in the APK (both allow-listed in Supabase)
  const redirectTo = Linking.createURL('/');
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;
  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('Google no devolvió el código de acceso');
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
}
