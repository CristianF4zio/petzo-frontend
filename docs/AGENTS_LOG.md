# Agents log

| Sprint | Agente | Tarea | Por qué un agente y no hacerlo directo |
| --- | --- | --- | --- |
| S0 | general-purpose (revisor) | Revisar las 3 migraciones contra SPEC §14/§15 | Corre en paralelo mientras baja Supabase local, y su contexto queda limpio para revisar solo esas secciones. Encontró 2 detalles menores (FK de `import_jobs`, falta `seed.sql`), ya corregidos |
| S1 | general-purpose (revisor de seguridad) | Revisar la API (IDOR, escalada por body, fugas de WhatsApp, rutas de fotos, transiciones) | Corre en paralelo mientras actualizo checklist y logs; contexto limpio enfocado en buscar fallos, no en defender el código que acabo de escribir |
