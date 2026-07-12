# Personal Trainer App — Instrucciones para Codex

## Objetivo
Completar y profesionalizar únicamente el módulo de entrenamiento de la aplicación existente.

No implementar nutrición.

## Stack existente
- Next.js 16
- App Router
- TypeScript
- Tailwind CSS
- shadcn/ui parcialmente instalado
- Supabase
- Desarrollo con Webpack

## Regla principal
No rehacer el proyecto desde cero.

Primero leer y comprender todo el código actual.

Evolucionar la aplicación existente de forma incremental.

## Estructura
- Rutas: app/
- Componentes: components/
- Lógica y acceso a datos: lib/
- Scripts: scripts/

Mantener imports con alias @/.

## Tablas de Supabase existentes
- profiles
- exercises
- workout_routines
- workout_days
- exercises_in_day
- user_training_state
- workout_sessions
- exercise_logs

No renombrar estas tablas.

No borrar tablas ni datos existentes.

No ejecutar:
- DROP
- TRUNCATE
- borrados masivos
- migraciones destructivas

Si hace falta SQL:
- crear archivos de migración
- explicar qué hacen
- no ejecutarlos automáticamente

## Estado actual
Ya funcionan:
- biblioteca de ejercicios
- importación de unos 220 ejercicios
- rutinas
- días secuenciales
- ejercicios planificados por día
- rutina activa
- inicio de sesión
- registro y actualización de series
- peso, reps y RIR
- finalización de sesión
- avance automático al siguiente día
- historial básico

## Consideraciones importantes
- Existe DEV_USER_ID temporal.
- Algunas tablas pueden tener RLS desactivado durante desarrollo.
- No migrar a autenticación real de golpe.
- Preparar cambios de auth solo con un plan explícito.
- Conservar en package.json:

  "dev": "next dev --webpack"

## Prioridades
1. Auditar el proyecto.
2. Consolidar navegación y dashboard.
3. Completar historial.
4. Mostrar “última vez” por ejercicio durante la sesión.
5. Progreso por ejercicio.
6. PRs automáticos.
7. Editar, borrar, duplicar y ordenar rutinas/días/ejercicios.
8. Pulir UX/UI mobile-first.
9. Ejecutar npm run build.

## Calidad
- No dejar imports rotos.
- No usar pseudocódigo.
- No introducir dependencias innecesarias.
- Crear componentes reutilizables.
- Corregir errores de TypeScript.
- Ejecutar npm run build tras cada fase.
- Informar de archivos modificados y cómo probarlos.
