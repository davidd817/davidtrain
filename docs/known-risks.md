# Riesgos conocidos y límites

## Supabase y RLS

La seguridad multiusuario depende de que las migraciones de Auth/RLS y las migraciones posteriores estén aplicadas en el proyecto correcto. Si RLS está desactivado durante desarrollo, el entorno no representa el nivel de aislamiento esperado en producción.

Recomendación: aplicar las migraciones en un proyecto de staging, comprobar las políticas con dos usuarios y documentar cualquier ajuste como una nueva migración aditiva.

## Configuración de entorno

La aplicación necesita `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` válidos para ejecutar los flujos completos. CI usa placeholders no funcionales solo para compilar rutas dinámicas; eso no sustituye una prueba de integración.

## Auth y redirects

El callback acepta destinos relativos internos y rechaza destinos absolutos o protocol-relative. Si se amplía el flujo de Auth, conserva esa restricción y revisa cualquier nuevo parámetro de redirección.

## Cobertura de verificación

Los tests actuales cubren lógica pura de validación, formato, YouTube y redirects. No cubren Supabase remoto, RPC, RLS, navegación de navegador ni despliegues. Esos flujos requieren smoke tests manuales o una futura suite de integración con un entorno aislado.
