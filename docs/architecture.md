# Arquitectura

## Capas

```text
app/ (rutas y composición de páginas)
  -> components/ (interacción cliente y UI reutilizable)
  -> lib/* (Server Actions, consultas y transformaciones de dominio)
  -> lib/supabase/* (clientes SSR, cookies y renovación de sesión)
  -> Supabase Auth + PostgreSQL + RLS
```

Las páginas que dependen de datos declaran `force-dynamic`. Los componentes cliente invocan Server Actions y llaman a `router.refresh()` después de mutaciones para conservar una única fuente de verdad en el servidor.

## Áreas de producto

- `/dashboard`: estado de rutina, día siguiente, sesión abierta y último entrenamiento.
- `/training`: biblioteca global y ejercicios personales.
- `/routines`: edición de rutinas, días y ejercicios planificados.
- `/workout/[sessionId]`: registro de series y comparación con la sesión anterior.
- `/progress` y `/history/[sessionId]`: agregados de historial, volumen, frecuencia y progreso por ejercicio.
- `/login`, `/register`, `/recover-password`: Auth de Supabase.

## Decisiones de mantenimiento

- Las consultas de servidor viven junto a su dominio en `lib/`, no en componentes cliente.
- Las mutaciones validan propiedad mediante el usuario de la sesión y no confían en IDs de usuario enviados por el navegador.
- El borrado físico está restringido a operaciones explícitas y seguras; se prefiere archivar para conservar historial.
- La navegación y el layout siguen siendo mobile-first y no requieren un estado global adicional.
