# Agents log

> Las filas S0–S2 son del plan anterior (API en Node + migraciones del CLI de Supabase). Desde D-22/D-23 el backend vive en `petzo-backend`, con su propio log; aquí siguen solo los sprints F1–F3.

| Sprint | Agente | Tarea | Por qué un agente y no hacerlo directo |
| --- | --- | --- | --- |
| S0 | general-purpose (revisor) | Revisar las 3 migraciones contra SPEC §14/§15 | Corre en paralelo mientras baja Supabase local, y su contexto queda limpio para revisar solo esas secciones. Encontró 2 detalles menores (FK de `import_jobs`, falta `seed.sql`), ya corregidos |
| S1 | general-purpose (revisor de seguridad) | Revisar la API (IDOR, escalada por body, fugas de WhatsApp, rutas de fotos, transiciones) | Corre en paralelo mientras actualizo checklist y logs; contexto limpio enfocado en buscar fallos, no en defender el código que acabo de escribir |
| S2 | `claude -p` (proceso aparte con MCP `claude_design`) | Leer `Petzo.dc.html` y `support.js` del proyecto de Claude Design | El MCP quedó registrado para `C:\…` y el panel de VS Code abre `c:\…`, así que sus herramientas no cargaban aquí; un proceso nuevo sí las ve y evita reiniciar la sesión. Lectura OK; la escritura la hice yo, verificando tamaño exacto |
