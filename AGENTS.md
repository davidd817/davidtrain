# Instrucciones para agentes de DavidTrain

## Objetivo del producto

DavidTrain es una aplicación personal para planificar, ejecutar y revisar entrenamientos. El alcance de este repositorio es el módulo de entrenamiento. No implementar nutrición ni ampliar el producto fuera de este alcance sin una instrucción explícita.

El flujo existente incluye biblioteca de ejercicios, rutinas, días secuenciales, ejercicios planificados, rutina activa, Auth de Supabase, sesiones, series, historial y progreso.

## Stack y estructura

- Next.js 16, App Router, React 19 y TypeScript estricto.
- Tailwind CSS 4, shadcn/ui parcialmente instalado, componentes UI locales y `lucide-react`.
- Supabase Auth, `@supabase/ssr` y PostgreSQL con RLS.
- Desarrollo con Webpack: conservar `"dev": "next dev --webpack"`.
- Rutas y composición: `app/`.
- UI reutilizable y componentes cliente: `components/`.
- Server Actions, consultas y lógica pura: `lib/`.
- Clientes SSR de Supabase: `lib/supabase/`.
- Migraciones SQL versionadas: `supabase/migrations/`.
- Utilidades administrativas manuales: `scripts/`.
- Documentación: `README.md`, `docs/`, `CONTRIBUTING.md`.

Usar imports con alias `@/`. Mantener la arquitectura existente y preferir cambios pequeños, locales y reversibles.
Antes de modificar, leer y comprender el código actual; no rehacer el proyecto desde cero.

## Modelo de datos conocido

No renombrar ni eliminar estas tablas: `profiles`, `exercises`, `workout_routines`, `workout_days`, `exercises_in_day`, `user_training_state`, `workout_sessions` y `exercise_logs`.

Las migraciones actuales también usan `user_exercise_favorites` y `workout_day_skips`. Antes de modificar consultas, inspeccionar el esquema y las migraciones correspondientes.

## Supabase, Auth y seguridad

- Obtener el usuario desde `supabase.auth.getUser()` en servidor; no confiar en un `user_id` enviado por el cliente.
- No reintroducir `DEV_USER_ID`. Si aparece en documentación antigua, tratarlo como deuda histórica.
- Algunas tablas pueden tener RLS desactivado durante desarrollo; no asumir que ese estado es seguro para producción.
- No migrar a autenticación real de golpe. Los cambios de Auth requieren un plan explícito y revisión humana.
- No añadir claves `service_role`, secretos ni tokens al cliente, al repositorio, a logs o a ejemplos.
- No leer, mostrar ni copiar `.env`, `.env.local` u otros secretos. Solo inspeccionar `.env.example`.
- Mantener las comprobaciones de propietario en Server Actions y las políticas RLS alineadas.
- Los redirects posteriores a Auth deben permanecer dentro del origen de la aplicación.
- No ejecutar SQL contra Supabase remoto desde una tarea de código.

## Migraciones y datos

No modificar ni ejecutar automáticamente migraciones existentes durante una tarea normal. No ejecutar `DROP`, `TRUNCATE`, borrados masivos ni cambios destructivos. Si hace falta SQL, crear una nueva migración aditiva, explicar su propósito y dejar su ejecución para revisión humana.

No borrar datos, usuarios o rutinas remotas. Preferir archivado cuando el dominio lo permita. El importador de `scripts/import-exercises.js` es manual, requiere `IMPORT_USER_ID` y no es onboarding normal.

## Git y cambios externos

Antes de editar:

```bash
git status
git diff
git branch --show-current
```

No cambiar de rama, hacer merge, rebase o `git reset --hard`, no borrar historial, crear commits, hacer push o force-push, crear Pull Requests remotos ni modificar configuración remota de GitHub. No desplegar con Vercel, ejecutar `vercel --prod`, promover previews ni cambiar producción, dominios, secretos o variables de Vercel.

## Calidad y verificación

Comandos principales:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` usa el test runner nativo de Node y cubre lógica pura. Añadir tests para validadores, transformaciones y cálculos deterministas; evitar tests contra Supabase remoto, Auth real, Vercel o APIs externas en la baseline.
No usar pseudocódigo ni introducir dependencias innecesarias; corregir errores claros de TypeScript/lint y crear componentes reutilizables cuando el patrón ya exista.

Antes de terminar:

1. revisar el diff completo y el `git diff --stat`;
2. confirmar que no se tocaron migraciones ni secretos;
3. comprobar imports, tipos, lint, tests y build;
4. indicar claramente cualquier comando `FAIL` o `NOT VERIFIED`;
5. listar archivos modificados y cómo probarlos;
6. confirmar rama, ausencia de commit/push y ausencia de cambios en producción.

En fases de implementación, ejecutar `npm run build` al cerrar cada fase relevante y explicar los archivos modificados y cómo probarlos.

## Cambios funcionales

Solo corregir bugs pequeños cuando la causa y el comportamiento esperado sean inequívocos y exista una verificación razonable. No rehacer la aplicación, cambiar framework, sustituir Supabase, cambiar App Router ni hacer refactorizaciones grandes por estética.

Las operaciones que afecten autenticación real, RLS, esquema, datos remotos, secretos, producción o despliegue requieren aprobación humana explícita y un plan antes de ejecutarse.
