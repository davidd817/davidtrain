# Módulo de entrenamiento

## Modelo de autenticación

La aplicación usa Supabase Auth con cookies gestionadas por `@supabase/ssr`. Las consultas servidor obtienen el usuario mediante `supabase.auth.getUser()` y las Server Actions no deben aceptar un `user_id` arbitrario desde el cliente.

El código actual no usa `DEV_USER_ID`. Si se encuentra una referencia antigua en una tarea o documento, debe tratarse como deuda histórica y no reintroducirse sin un plan explícito.

## Modelo conceptual

- `profiles`: perfil asociado a `auth.users`.
- `exercises`: ejercicios personales y biblioteca global.
- `user_exercise_favorites`: favoritos por usuario para ejercicios visibles.
- `workout_routines` → `workout_days` → `exercises_in_day`: planificación jerárquica.
- `user_training_state`: rutina activa y próximo índice de día.
- `workout_sessions` → `exercise_logs`: sesiones y series registradas.
- `workout_day_skips`: días omitidos, con usuario, rutina, día, fecha y motivo.

Las relaciones hijo deben comprobar la propiedad de la rutina, día o sesión. La fuente de autorización es Supabase Auth/RLS y las comprobaciones de propietario que realizan las Server Actions.

## RLS y migraciones

La migración `20260711170000_auth_rls_multiuser.sql` habilita RLS sobre las tablas principales. Las siguientes migraciones amplían las políticas para biblioteca global, favoritos, saltos y sesiones fiables. Aplícalas manualmente en orden; no ejecutes SQL remoto desde una tarea de mantenimiento del código.

## Flujo de sesión

Una sesión en progreso se crea para el día elegido, las series se guardan con clave lógica de sesión/ejercicio/serie y la finalización usa una función RPC atómica. Las sesiones canceladas se excluyen del historial y del progreso. El dashboard ofrece continuar una sesión abierta y el entrenamiento muestra el rendimiento anterior del mismo día.

## Importación de ejercicios

`scripts/import-exercises.js` es una utilidad administrativa manual. Lee `scripts/exercise-library.txt`, requiere `IMPORT_USER_ID` y usa únicamente la clave publicable de Supabase. No forma parte del onboarding y no debe ejecutarse contra producción sin revisar usuario, datos y permisos.
