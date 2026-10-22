# Agents log

| Sprint | Agente | Tarea | Por qué un agente y no hacerlo directo |
| --- | --- | --- | --- |
| S0 | general-purpose (revisor) | Revisar las 3 migraciones contra SPEC §14/§15 | Corre en paralelo mientras baja Supabase local, y su contexto queda limpio para revisar solo esas secciones. Encontró 2 detalles menores (FK de `import_jobs`, falta `seed.sql`), ya corregidos |
