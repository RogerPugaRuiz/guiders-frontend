# Fix: URLs Hardcodeadas en Servicios

## Problema
Algunos servicios tenían URLs hardcodeadas a `http://localhost:3000` que causaban fallos en producción al no usar la configuración del environment.

## Servicios Corregidos

### 1. `visitors-data-service.ts` (EN USO)
**Ubicación**: `libs/chat/data-access/visitors-data-service/src/lib/visitors-data-service.ts`

**Antes:**
```typescript
private readonly baseUrl = 'http://localhost:3000/api';
```

**Después:**
```typescript
private readonly environment = inject(ENVIRONMENT_TOKEN);
private readonly baseUrl = `${this.environment.api.baseUrl}`;
```

**Cambios:**
- Importado `ENVIRONMENT_TOKEN` desde `@guiders-frontend/auth/data-access/session`
- Inyectado el environment usando `inject()`
- Construido baseUrl dinámicamente desde la configuración

### 2. `visitors-data-service.ts` (ARCHIVO DUPLICADO)
**Ubicación**: `libs/chat/data-access/src/lib/visitors-data-service/visitors-data-service.ts`

**Estado**: ⚠️ Archivo no utilizado, posible candidato para eliminación
- No tiene imports correctos configurados
- No aparece en ningún import del proyecto
- Genera errores de compilación

## Servicios Verificados (OK) ✅

### `chat.service.ts`
- ✅ Usa `this.baseUrl = \`\${this.environment.api.baseUrl}/v2\``
- ✅ Todas las peticiones HTTP usan `this.baseUrl`

### `websocket.service.ts`
- ✅ Usa `this.environment.api.wsUrl` primero
- ✅ Fallback a `this.environment.api.baseUrl` si wsUrl no existe
- ✅ Fallback final a localhost solo para desarrollo

### `auth-refresh.service.ts`
- ✅ Usa `this.environment.api.baseUrl` correctamente

## Configuración de Environments

### Producción (`environment.prod.ts`)
```typescript
api: {
  baseUrl: 'https://guiders.es/api',
  wsUrl: 'https://guiders.es' // Para WebSocket
}
```

### Staging (`environment.staging.ts`)
```typescript
api: {
  baseUrl: 'https://guiders.es/api',
  wsUrl: 'https://guiders.es'
}
```

### Desarrollo (`environment.ts`)
```typescript
api: {
  baseUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000'
}
```

## Verificación

```bash
# Build exitoso en producción
npm run build:prod

# Build exitoso en staging
npm run build:staging

# Build exitoso para desarrollo
npm run build:all
```

## Recomendaciones

1. **Eliminar archivo duplicado**: `libs/chat/data-access/src/lib/visitors-data-service/visitors-data-service.ts`
2. **Auditar otros servicios**: Buscar más hardcoded URLs con:
   ```bash
   grep -r "http://localhost" libs/
   grep -r "https://guiders.es" libs/
   ```
3. **Agregar lint rule**: Considerar agregar regla ESLint para detectar URLs hardcodeadas

## Impacto

- ✅ Todas las peticiones HTTP ahora usan la configuración del environment
- ✅ El código funciona correctamente en dev, staging y producción
- ✅ No hay cambios en el comportamiento en desarrollo
- ✅ Fix crítico para deployment en producción

## Fecha
3 de octubre de 2025
