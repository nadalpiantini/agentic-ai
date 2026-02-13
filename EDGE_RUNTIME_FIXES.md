# Edge Runtime Compatibility Fixes for sephirot.xyz

**Problema detectado:** Error 500 en `/api/threads` - `process.env` no funciona correctamente en Vercel Edge Runtime.

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `app/api/threads/route.ts` | Reemplazado `pg` Pool por Supabase client |
| `lib/supabase/server.ts` | Variables explícitas al inicio |
| `lib/supabase/admin.ts` | Variables explícitas al inicio |
| `lib/supabase/client.ts` | Variables explícitas al inicio |
| `lib/vector-store/index.ts` | Variables explícitas al inicio |
| `lib/supabase/middleware.ts` | Variables explícitas al inicio |
| `lib/agent/tools/file-system.ts` | Variable explícita para WORKSPACE_DIR |
| `middleware.ts` | Variables explícitas al inicio |
| `app/api/threads/[threadId]/route.ts` | Variables explícitas + helper function |
| `app/(auth)/callback/route.ts` | Variables explícitas al inicio |
| `app/(auth)/login/page.tsx` | Variables explícitas en useMemo |
| `lib/utils/env.ts` | Variables explícitas para NODE_ENV check |

## Cambios Técnicos

### Antes (Error en Edge Runtime):
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

### Después (Compatible con Edge Runtime):
```typescript
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
```

## Por qué funciona

Vercel Edge Runtime tiene limitaciones con `process.env`:
- Solo `NEXT_PUBLIC_*` variables están disponibles automaticamente
- Otras variables necesitan leerse explícitamente al inicio del archivo
- Asignar a una variable constante previene errores de runtime

## Deploy Pendiente

Para aplicar estos cambios:
1. Hacer commit de los cambios
2. Push a GitHub
3. Deploy automático en Vercel
