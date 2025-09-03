# Copilot Instructions for AI Agents

## Arquitectura y Estructura General
- Este monorepo usa **Nx** (v21+) y está organizado bajo `apps/` para aplicaciones y `libs/` para futuras librerías.
- Las aplicaciones principales son:
  - `admin`: Panel administrativo Angular (ruta: `apps/admin`)
  - `console`: Consola de usuario Angular (ruta: `apps/console`)
  - Cada una tiene su propio E2E con Playwright (`admin-e2e`, `console-e2e`).
- Cada app Angular es **standalone** (sin módulo raíz) y usa rutas en `app.routes.ts`.
- El flujo de trabajo principal es Angular + Vite + Nx, con estilos SCSS y ESLint para linting.

## Comandos y Flujos de Desarrollo
- Servir apps:
  - `npm run serve:admin` (http://localhost:4201)
  - `npm run serve:console` (http://localhost:4200)
- Build, test y lint:
  - `nx build <app>`
  - `nx test <app>`
  - `nx lint <app>`
- E2E:
  - E2E está en `apps/<app>-e2e` y usa Playwright.
- Para ver los targets disponibles: `nx show project <app>`
- Para visualizar dependencias: `nx graph`

## Convenciones y Patrones Específicos
- **Prefijos de selector**: Cada app tiene su propio prefijo (`admin-`, `console-`).
- **Estilos globales**: Cada app importa su propio `styles.scss`.
- **Configuración de targets**: Los targets Nx están definidos en `project.json` de cada app.
- **No hay librerías compartidas aún**, pero se recomienda crearlas bajo `libs/` si se detecta duplicidad.
- **No modificar archivos generados por Nx Console** manualmente.

## Integraciones y Dependencias
- Angular 20, Nx 21, Vite, Playwright, ESLint, SCSS.
- Los comandos personalizados están en `package.json` (ej: `serve:admin`).
- Las dependencias y versiones están centralizadas en la raíz.

## Archivos Clave
- `apps/<app>/project.json`: Configuración de targets Nx.
- `apps/<app>/src/app/`: Código fuente principal de cada app.
- `.github/instructions/nx.instructions.md`: Instrucciones Nx para agentes.
- `README.md`: Guía general del workspace.

## Ejemplo de patrón de componente
```typescript
@Component({
  selector: 'admin-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
```

## Recomendaciones para agentes
- Usar los comandos Nx y scripts npm para tareas comunes.
- Consultar los archivos `project.json` para entender los targets y configuraciones.
- Seguir la estructura y convenciones de Nx/Angular para nuevas apps o libs.
- Si se requiere integración o patrón no documentado, consultar primero con el usuario.
