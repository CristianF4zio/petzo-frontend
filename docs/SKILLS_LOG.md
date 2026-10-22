# Skills log

> Las filas S0–S2 son del plan anterior (API en Node + migraciones del CLI de Supabase). Desde D-22/D-23 el backend vive en `petzo-backend`, con su propio log; aquí siguen solo los sprints F1–F3.

| Sprint | Skill | Para qué la usaste | Resultado |
| --- | --- | --- | --- |
| S0 | anthropic-skills:docs | Leer la spec desde el Claude Doc y exportarla a `docs/SPEC.md` | SPEC.md generado (§1–§17) |
| S0 | architect | Decidir si el esquema/RLS necesitaba diseño antes de migrar | No-architecture-decision: §14/§15 ya fijan el modelo; solo `sex` (male/female) quedó a criterio |
| S0 | agents-md | Redactar `CLAUDE.md` breve con stack, comandos y reglas | `CLAUDE.md` < 60 líneas |
| S1 | api-and-interface-design | Definir forma de errores, validación en el borde, paginación y nombres de rutas | Errores `{error:{code,message,details}}`, zod en cada entrada, catálogo `{data,pagination}`; transiciones de estado en un solo `PATCH /pets/:id/status` |
| S1 | ponytail:ponytail-audit | Auditoría completa del repo tras S1 (bugs, seguridad, escala, tests) | 15 hallazgos (3 críticos: pausa→edición salta moderación, avatar con URL arbitraria, catálogo filtraba `risk_score`); 14 corregidos en código con prueba en el smoke, 1 es configuración de la nube |
| S1 | ponytail:ponytail-review | Revisar los cambios de S1 + correcciones de la auditoría antes del commit | 2 hallazgos (fotos abandonadas bloqueaban la mascota; usuario borrado recibía 422 en vez de 401), ambos corregidos con prueba; se eliminó el error `TOO_MANY_UPLOADS` que quedó sin uso |
| S2 | design-md | Elegir y leer un sistema de diseño de referencia (marketplace centrado en foto) para el prompt de Claude Design | Tokens adaptados a marca propia (terracota `#C2410C`, verde verificado), radios, espaciado y sombra única en `docs/DESIGN_PROMPT.md` |
| S2 | frontend-ui-engineering | Criterios anti "estética IA", estados obligatorios y accesibilidad para el prompt | Lista de patrones a rechazar, estados vacío/error/carga por pantalla, contraste AA y objetivos de 48 dp |
| S2 | vercel-react-native-skills | Reglas de rendimiento y UI para la app Expo | `FlashList` en el catálogo, `PetCard` memorizado con callbacks estables, `expo-image`, `Pressable`, `StyleSheet.create`, sin `&&` con valores falsy |
| F1 | vercel-react-native-skills | Revisar las pantallas al migrar el cliente al contrato Java | Se mantuvieron `expo-image`, `PetCard` memorizado y listas virtualizadas; solo cambiaron tipos, rutas y el flujo de fotos |
| F1 | code-review | Revisar el diff de la migración (app + endpoints nuevos del backend) antes del commit | 9 hallazgos (galería llena no se podía reemplazar, mascota atascada en revisión al borrar foto, N moderaciones por envío); corregidos con D-28 y `PUT /photos` |
