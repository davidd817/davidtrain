# Despliegue

Este documento describe la configuración y verificación del despliegue. Vercel puede crear previews o despliegues automáticos si el repositorio está conectado y así lo establece la configuración externa del proyecto; este repositorio no contiene un workflow propio de despliegue ni modifica producción desde CI.

## Variables de entorno

Configura en el proveedor de hosting:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Usa el origen público real en `NEXT_PUBLIC_SITE_URL`, por ejemplo `https://tu-app.vercel.app`. No añadas claves `service_role` ni secretos privados al frontend.

## Migraciones de Supabase

Revisa y aplica manualmente, en este orden, los archivos de `supabase/migrations/`:

1. `20260711143000_training_module_completion.sql`
2. `20260711170000_auth_rls_multiuser.sql`
3. `20260712150000_global_exercise_library.sql`
4. `20260719120000_workout_day_skips.sql`
5. `20260801120000_reliable_workout_sessions.sql`
6. `20260815120000_exercise_technique_videos.sql`

Son migraciones aditivas según sus comentarios y no deben ejecutarse automáticamente durante esta pasada. La segunda migración requiere que el modelo de Auth/RLS sea compatible con los usuarios existentes; revisa especialmente las políticas antes de usar el entorno con varios usuarios.

## Supabase Auth

En la configuración de Auth añade:

- Site URL: el valor de `NEXT_PUBLIC_SITE_URL` de producción.
- Redirect URL local: `http://localhost:3000/auth/callback`.
- Redirect URL de producción: `https://tu-app.vercel.app/auth/callback`.

Si se usa un dominio propio, añade también su callback explícito.

## Vercel u otro hosting

1. Conecta el repositorio al proveedor de Next.js si quieres previews o despliegues automáticos.
2. Revisa qué rama, entornos y dominios están configurados en el proveedor; esa configuración es externa a este repositorio.
3. Usa `npm ci` para instalar y `npm run build` para compilar.
4. Configura las variables de entorno del entorno correspondiente.
5. Verifica el arranque de `/login`, registro, callback, dashboard y una sesión de entrenamiento.

## Smoke test manual

1. Registra una cuenta y confirma el email si Supabase lo exige.
2. Inicia sesión y confirma que `/dashboard` muestra el estado vacío correctamente.
3. Crea una rutina, un día y un ejercicio planificado.
4. Inicia una sesión, guarda una serie y finalízala.
5. Comprueba el historial y el progreso.
6. Prueba logout y login con otra cuenta para confirmar aislamiento de datos.
