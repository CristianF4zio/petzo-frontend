# Skills log

> Etiquetas: B0–B4, F1–F3 son los sprints de SPEC §16. "Legado S0/S1" fueron sprints del plan anterior (API en Node + migraciones del CLI de Supabase, borrados en D-22/D-25); "F1 (S2)" es trabajo del plan anterior que sigue vivo en la app (diseño y pantallas).

| Sprint | Skill | Para qué la usaste | Resultado y cómo lo comprobé |
| --- | --- | --- | --- |
| Legado S0 | anthropic-skills:docs | Leer la spec desde el Claude Doc y exportarla a `docs/SPEC.md` | SPEC.md generado (§1–§17) |
| Legado S0 | architect | Decidir si el esquema/RLS necesitaba diseño antes de migrar | No-architecture-decision: §14/§15 ya fijan el modelo; solo `sex` (male/female) quedó a criterio |
| Legado S0 | agents-md | Redactar `CLAUDE.md` breve con stack, comandos y reglas | `CLAUDE.md` < 60 líneas |
| Legado S1 | api-and-interface-design | Definir forma de errores, validación en el borde, paginación y nombres de rutas | Errores `{error:{code,message,details}}`, zod en cada entrada, catálogo `{data,pagination}`; transiciones de estado en un solo `PATCH /pets/:id/status` |
| Legado S1 | ponytail:ponytail-audit | Auditoría completa del repo tras S1 (bugs, seguridad, escala, tests) | 15 hallazgos (3 críticos: pausa→edición salta moderación, avatar con URL arbitraria, catálogo filtraba `risk_score`); 14 corregidos en código con prueba en el smoke, 1 es configuración de la nube |
| Legado S1 | ponytail:ponytail-review | Revisar los cambios de S1 + correcciones de la auditoría antes del commit | 2 hallazgos (fotos abandonadas bloqueaban la mascota; usuario borrado recibía 422 en vez de 401), ambos corregidos con prueba; se eliminó el error `TOO_MANY_UPLOADS` que quedó sin uso |
| F1 (S2) | design-md | Elegir y leer un sistema de diseño de referencia (marketplace centrado en foto) para el prompt de Claude Design | Tokens adaptados a marca propia (terracota `#C2410C`, verde verificado), radios, espaciado y sombra única en `docs/DESIGN_PROMPT.md` |
| F1 (S2) | frontend-ui-engineering | Criterios anti "estética IA", estados obligatorios y accesibilidad para el prompt | Lista de patrones a rechazar, estados vacío/error/carga por pantalla, contraste AA y objetivos de 48 dp |
| F1 (S2) | vercel-react-native-skills | Reglas de rendimiento y UI para la app Expo | `FlashList` en el catálogo, `PetCard` memorizado con callbacks estables, `expo-image`, `Pressable`, `StyleSheet.create`, sin `&&` con valores falsy |
| F1 | vercel-react-native-skills | Revisar las pantallas al migrar el cliente al contrato Java | Se mantuvieron `expo-image`, `PetCard` memorizado y listas virtualizadas; solo cambiaron tipos, rutas y el flujo de fotos |
| F1 | code-review | Revisar el diff de la migración (app + endpoints nuevos del backend) antes del commit | 9 hallazgos (galería llena no se podía reemplazar, mascota atascada en revisión al borrar foto, N moderaciones por envío); corregidos con D-28 y `PUT /photos` |
| F1 | vercel-react-native-skills | Pantallas nuevas de solicitudes, match y fundación | `expo-image`, `Pressable`, `StyleSheet.create`, `useFocusEffect` para refrescar estados, sin `&&` con falsy |
| F1 | code-review | Revisar HU-06/07/08/09/12 antes del commit | 10 hallazgos: WhatsApp inaccesible tras adoptar la mascota, solicitudes ocultas en revisión, prefill que pisaba respuestas, aprobar sobre mascota adoptada, lógica duplicada; todos corregidos |
| F1 | ponytail (nivel full, toda la sesión) | Cambio mínimo en la migración al contrato Java y en HU-06/07/08/09/12 | Se reusaron `Sheet`, `Segmented`, `Field`, `StateView` y `api()`; lógica compartida en `lib/` (`openContact`, `HOUSING`, `scoreColors`) en vez de duplicarla |
| F1 | ponytail:ponytail-audit | Auditoría completa de `apps/mobile` (solo lectura) | 14 hallazgos; los más graves: `fetch` sin timeout (pantalla en blanco con red lenta) y el bug de edición compartido con el backend |
| F2 (en petzo-web, antes de mudarlo) | ponytail (nivel full) | Limpiar el scaffold de Vite sin adelantar trabajo de F2 | Se borró la demo (assets, CSS, iconos) y quedó un `App.tsx` de 3 líneas; `build` y `lint` OK |
| F2 (en petzo-web, antes de mudarlo) | ponytail:ponytail-audit | Revisar el scaffold | 1 hallazgo: `VITE_API_URL` apunta al puerto 3000 de la API de Node borrada |
| Reto | vercel-react-native-skills | Sesión con `expo-secure-store`, subida multipart y Google con `expo-web-browser` + `expo-crypto` | Paquetes de Expo Go (sin módulos nativos extra); comprobado con `tsc` y el bundle |
