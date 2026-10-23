# Agents log

> Etiquetas: B0–B4, F1–F3 son los sprints de SPEC §16. "Legado S0/S1" fueron sprints del plan anterior (API en Node + migraciones del CLI de Supabase, borrados en D-22/D-25); "F1 (S2)" es trabajo del plan anterior que sigue vivo en la app (diseño y pantallas).

| Sprint | Agente | Tarea | Por qué un agente y no hacerlo directo |
| --- | --- | --- | --- |
| Legado S0 | general-purpose (revisor) | Revisar las 3 migraciones contra SPEC §14/§15 | Corre en paralelo mientras baja Supabase local, y su contexto queda limpio para revisar solo esas secciones. Encontró 2 detalles menores (FK de `import_jobs`, falta `seed.sql`), ya corregidos |
| Legado S1 | general-purpose (revisor de seguridad) | Revisar la API (IDOR, escalada por body, fugas de WhatsApp, rutas de fotos, transiciones) | Corre en paralelo mientras actualizo checklist y logs; contexto limpio enfocado en buscar fallos, no en defender el código que acabo de escribir |
| F1 (S2) | `claude -p` (proceso aparte con MCP `claude_design`) | Leer `Petzo.dc.html` y `support.js` del proyecto de Claude Design | El MCP quedó registrado para `C:\…` y el panel de VS Code abre `c:\…`, así que sus herramientas no cargaban aquí; un proceso nuevo sí las ve y evita reiniciar la sesión. Lectura OK; la escritura la hice yo, verificando tamaño exacto |
| F1 | code-review (subagente en contexto aparte) | Revisar la migración del cliente al contrato Java | Revisión con ojos frescos sobre app + backend a la vez; detectó el flujo de fotos frágil, corregido con D-28 |
| F1 | code-review (subagente en contexto aparte) | Revisar las pantallas de solicitudes, match y fundación contra el contrato del backend | Leyó app + servicios Java a la vez sin cargar mi contexto; sus 10 hallazgos se corrigieron antes del commit |
| F1 | general-purpose (auditor ponytail de la app) | Auditar toda la app contra el contrato del backend | En paralelo con el auditor del backend; revisó `src/` completo y el código nativo de timeouts de React Native |
| F1 | general-purpose (implementador) | Aplicar en paralelo los arreglos de la auditoría en la app (3, 4, 11–17, 20) mientras yo hacía los del backend | Los dos repos no comparten archivos; revisé su diff de `lib/` a mano antes del commit; `tsc` + bundle OK |
