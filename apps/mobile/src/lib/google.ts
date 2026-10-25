import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { ApiError, BASE, api, type Tokens } from './api';

WebBrowser.maybeCompleteAuthSession();

const base64url = (b64: string) => b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// The backend runs the whole Google flow; tokens never travel in a URL. The app proves it started
// the flow by claiming it with the secret behind the challenge. Returns null when the user closes the browser.
export async function googleTokens() {
  const flow = Crypto.randomUUID();
  const secret = base64url(btoa(String.fromCharCode(...Crypto.getRandomBytes(32))));
  const challenge = base64url(await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, secret, { encoding: Crypto.CryptoEncoding.BASE64 }));
  // exp://<ip>:8081/--/auth-callback in Expo Go, petzo://auth-callback in the APK
  const returnUrl = Linking.createURL('auth-callback');
  const result = await WebBrowser.openAuthSessionAsync(`${BASE}/auth/google/start?flow=${flow}&challenge=${challenge}&redirect=${encodeURIComponent(returnUrl)}`, returnUrl);
  if (result.type !== 'success') return null;
  if (Linking.parse(result.url).queryParams?.error) throw new ApiError(0, 'GOOGLE_FAILED', 'No pudimos entrar con Google. Intenta de nuevo.');
  return api<Tokens>('/auth/google/claim', { method: 'POST', body: { flow, secret } });
}
