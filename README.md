# Petzo · app móvil y panel admin

Clientes de **Petzo**, adopción de perros y gatos en Gran Caracas. Los dos consumen solo la API de [petzo-backend](https://github.com/CristianF4zio/petzo-backend); **ninguno habla con Supabase** (ni BD, ni Storage, ni Auth).

| Carpeta | Qué es |
| --- | --- |
| `apps/mobile` | App React Native + Expo (TypeScript, Expo Router). **Plataforma elegida: iOS con Expo Go** en un iPhone físico, porque es el teléfono donde probé de verdad y Expo Go no pide cuenta de desarrollador ni tiendas. El mismo código corre en Android (probado en emulador) |
| `apps/admin` | **Panel admin web** React + Vite: moderación, fundaciones y planes, usuarios, reportes, importaciones (Stagehand) y métricas |
| `docs/` | Checklist, diseño y logs de skills y agentes |

- **Registro de decisiones:** [petzo-backend/docs/DECISIONS.md](https://github.com/CristianF4zio/petzo-backend/blob/main/docs/DECISIONS.md)
- **Setup de Supabase, variables del backend y API:** [README del backend](https://github.com/CristianF4zio/petzo-backend#readme)

## Versiones

Node ≥ 22.18 · Expo SDK 58 (React Native, `expo-router` 58, `expo-secure-store`, `expo-crypto`) · React 19 + Vite para el panel · Expo Go en el celular.

## 1. Arrancar la API

En `petzo-backend`: `./mvnw spring-boot:run` → `http://localhost:8090`. Antes, en Supabase → Authentication → URL Configuration, pon como **Site URL** `http://<IP-de-tu-PC>:8090` y agrega `http://localhost:8090/**` y `http://<IP-de-tu-PC>:8090/**` a Redirect URLs (detalle y flujo de Google sin tokens en el [README del backend](https://github.com/CristianF4zio/petzo-backend#login-con-google-regreso-sin-tokens-en-urls-ni-logs)).

## 2. App móvil (iOS con Expo Go)

```bash
cd apps/mobile
cp .env.example .env      # EXPO_PUBLIC_API_URL=http://<IP-de-tu-PC-en-el-wifi>:8090
npm ci
npx expo login            # misma cuenta con la que entras a Expo Go en el iPhone
REACT_NATIVE_PACKAGER_HOSTNAME=<IP-de-tu-PC> npx expo start   # en PowerShell: $env:REACT_NATIVE_PACKAGER_HOSTNAME="<IP>"
```

1. Instala **Expo Go** desde la App Store y conecta el iPhone al mismo wifi que la PC.
2. Escanea el QR con la cámara.
3. Si no conecta: abre `http://<IP>:8090/api/municipalities` en el navegador del iPhone. Si no carga, revisa el firewall de Windows (puerto 8090) o la VPN.

**Login:**
- Con correo: va contra `/api/auth/*`.
- Con Google: la app abre `/api/auth/google/start`. Google muestra su pantalla oficial, la API recibe el callback y devuelve el navegador a `exp://…/--/auth-callback` **sin tokens en la URL**. Luego la app pide la sesión con `POST /api/auth/google/claim`.
- La sesión se guarda en el llavero del teléfono (`expo-secure-store`).

### Android (emulador de Android Studio)

Sin depender del wifi ni de la VPN: los puertos de Metro y de la API se pasan al emulador con `adb reverse`.

```bash
emulator -avd <tu-AVD>                         # o desde Android Studio → Device Manager
adb reverse tcp:8086 tcp:8086 && adb reverse tcp:8090 tcp:8090
# PowerShell: $env:REACT_NATIVE_PACKAGER_HOSTNAME="127.0.0.1"; $env:EXPO_PUBLIC_API_URL="http://localhost:8090"
npx expo start --port 8086
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8086" host.exp.exponent
```

No uses `--localhost`: en Windows deja a Metro escuchando solo en IPv6 (`::1`), y `adb reverse` entra por IPv4. Probado el 25-oct-2026: Bienvenida, login por correo contra la API y catálogo con fotos servidas por la API.

## 3. Panel admin

```bash
cd apps/admin
cp .env.example .env      # VITE_API_URL=http://localhost:8090
npm ci
npm run dev               # http://localhost:5173
```

Necesita un usuario administrador. Regístralo y luego corre en Supabase → SQL Editor:
```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'tu-correo-admin@ejemplo.com');
```
El backend rechaza con 403 cualquier `/api/admin/**` de un usuario que no sea admin.

## 4. Recorrido de prueba

Usa datos inventados y no publiques contraseñas.

1. **Cuenta A:** se registra, completa su perfil (zona y WhatsApp) y publica una mascota con fotos. La mascota queda *En revisión*.
2. **Moderación:** la modera n8n (si los flujos están activos) o el admin desde el panel → **Moderación** → *Aprobar*.
3. **Cuenta B:** busca en el catálogo, envía una solicitud y la ve como *Pendiente* en *Mis solicitudes*.
4. **Cuenta A:** en *Mis publicaciones* → *Ver solicitudes* → *Aprobar*. Los dos ven el botón **Escribir por WhatsApp**.
5. **Panel → Importaciones:** con `patas-del-avila`, el worker de Stagehand crea 4 borradores.

## Verificación antes de commitear

- App: `npx tsc --noEmit` y `npx expo export --platform android`.
- Panel: `npm run build` y `npm run lint`.

## Limitaciones conocidas

- Probado en iOS (Expo Go, iPhone) y en el emulador de Android; no en un Android físico.
- La app pide sesión para todo; el visitante sin cuenta queda para v2.
- Con Expo Go, la IP de la PC cambia según la red: hay que actualizar `.env` y la Site URL de Supabase.
