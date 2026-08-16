# DavidTrain

DavidTrain es una aplicación web personal para planificar y registrar entrenamientos. El repositorio se centra en el módulo de entrenamiento: biblioteca de ejercicios, rutinas, sesiones, historial y métricas de progreso.

## Estado actual

El flujo principal está implementado y usa Supabase Auth con sesiones basadas en cookies. La aplicación permite:

- crear, editar, archivar, duplicar y ordenar rutinas y días;
- crear y gestionar ejercicios personales y consultar una biblioteca global;
- añadir ejercicios planificados con series, rango de repeticiones, RIR, descanso y notas;
- activar una rutina, avanzar por sus días y saltar un día;
- iniciar, continuar, cancelar y finalizar sesiones;
- guardar peso, repeticiones y RIR por serie;
- mostrar el rendimiento anterior del mismo ejercicio y día durante una sesión;
- consultar historial, volumen, frecuencia, mejores cargas y 1RM estimado;
- adjuntar y validar enlaces de técnica de YouTube.

La ruta de nutrición existe únicamente como pantalla pendiente y no forma parte del alcance de este proyecto.

## Stack y arquitectura

- Next.js 16 con App Router y TypeScript.
- React 19, Tailwind CSS 4 y componentes UI ligeros.
- Supabase Auth, Supabase SSR y PostgreSQL.
- Desarrollo con Webpack, conservando `next dev --webpack`.

Las páginas servidor viven en `app/`. Los componentes interactivos están en `components/`. Las Server Actions y consultas de dominio están en `lib/`, con los clientes de Supabase en `lib/supabase/`. Las migraciones SQL versionadas están en `supabase/migrations/` y las utilidades manuales en `scripts/`.

El flujo habitual es:

1. una página de `app/` obtiene datos mediante funciones de `lib/`;
2. las mutaciones se ejecutan mediante Server Actions;
3. los componentes cliente actualizan la interfaz y refrescan los datos del servidor;
4. Supabase Auth identifica al usuario y las políticas RLS limitan el acceso a sus datos.

## Requisitos

- Node.js 22 LTS o posterior para ejecutar también la baseline de tests nativa;
- npm;
- un proyecto de Supabase configurado con las migraciones del repositorio.

## Instalación local

```bash
git clone https://github.com/davidd817/davidtrain.git
cd davidtrain
copy .env.example .env.local
npm ci
```

Completa `.env.local` con los valores de tu propio proyecto de Supabase. No subas ese archivo al repositorio.

## Variables de entorno

Los nombres soportados por el código y documentados en `.env.example` son:

- `NEXT_PUBLIC_SUPABASE_URL`: URL pública del proyecto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: clave publicable/anónima del proyecto.
- `NEXT_PUBLIC_SITE_URL`: origen de la aplicación para enlaces de Auth.
- `IMPORT_USER_ID`: opcional; solo lo usa el script manual de importación de ejercicios.

No se necesita ni se debe configurar una clave `service_role` para ejecutar la aplicación.

## Desarrollo y comandos

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

El servidor de desarrollo queda disponible en `http://localhost:3000`. `npm test` usa el test runner integrado de Node para validar lógica pura sin añadir dependencias de testing.

## Supabase y migraciones

El modelo principal utiliza `profiles`, `exercises`, `workout_routines`, `workout_days`, `exercises_in_day`, `user_training_state`, `workout_sessions` y `exercise_logs`. Las evoluciones adicionales utilizan `user_exercise_favorites` y `workout_day_skips`.

Las migraciones se aplican manualmente en Supabase, en orden cronológico, y no se ejecutan desde la aplicación ni desde CI. Antes de aplicarlas en un proyecto existente, revisa sus políticas RLS, funciones y datos. Consulta [docs/deployment.md](docs/deployment.md) y [docs/known-risks.md](docs/known-risks.md).

## Despliegue

El proyecto está preparado para un despliegue estándar de Next.js, incluido Vercel. Este repositorio no contiene un workflow propio de despliegue; si Vercel está conectado al repositorio, sus previews y despliegues automáticos dependen de la configuración externa de ese proyecto. Configura las variables de entorno en el proveedor, establece `npm run build` como comando de build y añade en Supabase las URLs de callback correspondientes. Los pasos están en [docs/deployment.md](docs/deployment.md).

## Seguridad y limitaciones

- Las claves de Supabase usadas por el navegador deben ser únicamente publicables.
- La autorización depende de Supabase Auth y de RLS; la migración de Auth/RLS debe estar aplicada y revisada antes de un uso multiusuario.
- El importador de ejercicios es una utilidad administrativa manual y escribe en Supabase; no debe usarse como onboarding normal.
- No hay pruebas end-to-end contra Supabase, Vercel ni Auth real en CI.
- La aplicación necesita un proyecto Supabase accesible para probar los flujos completos.

## Contribución y desarrollo

Lee [AGENTS.md](AGENTS.md) antes de modificar el repositorio y [CONTRIBUTING.md](CONTRIBUTING.md) para el flujo de cambios. Mantén los cambios pequeños, no edites migraciones existentes sin una razón explícita y ejecuta lint, typecheck, tests y build antes de solicitar revisión.
