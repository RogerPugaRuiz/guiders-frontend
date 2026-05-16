# OpenCode Custom Commands

Este directorio contiene comandos personalizados de OpenCode para flujos de trabajo comunes en guiders-frontend.

## Comandos disponibles

### `/publish`

**Descripción**: Publica cambios a la rama main con análisis completo

**Uso**:

```
/publish
```

**Qué hace**:

1. Muestra el estado actual de git
2. Muestra el diff estadístico de cambios
3. Crea un mensaje de commit significativo
4. Realiza staging de todos los cambios
5. Hace commit con un mensaje descriptivo
6. Hace push a origin/main
7. Verifica el push exitoso

**Modelo**: GitHub Copilot GPT-5-mini

---

### `/quick-publish`

**Descripción**: Publica cambios rápidamente (commit y push sin análisis extenso)

**Uso**:

```
/quick-publish
```

**Qué hace**:

1. Muestra cambios en formato corto
2. Realiza staging de todos los cambios
3. Crea un mensaje de commit conciso
4. Hace push a origin/main
5. Muestra el commit confirmado

**Modelo**: GitHub Copilot GPT-5-mini

---

## Flujo de CI/CD

Cada push a `main` dispara automáticamente:

1. **semantic-release** — analiza los commits desde el último tag y genera la siguiente versión (e.g. `0.1.0`, `0.0.3`)
2. **Inject version** — sustituye el placeholder `0.0.0-local` en los environment files con la versión real antes del build
3. **Build** — `nx build` con `--configuration=production`
4. **Deploy** — rsync al servidor vía VPN WireGuard + SSH

El workflow se encuentra en `.github/workflows/deploy.yml`.

### Versiones generadas por semantic-release

Los commits siguiendo Conventional Commits determinan el tipo de bump:

| Prefijo | Tipo de bump | Ejemplo |
|---------|-------------|---------|
| `fix:` | patch | `0.0.2` → `0.0.3` |
| `feat:` | minor | `0.0.3` → `0.1.0` |
| `feat!:` / `BREAKING CHANGE` | major | `0.1.0` → `1.0.0` |

---

## Convenciones de mensajes de commit

Los comandos usan [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nueva característica
- `fix:` - Corrección de bug
- `refactor:` - Cambio de código sin añadir funcionalidad
- `docs:` - Cambios en documentación
- `test:` - Cambios en tests
- `chore:` - Cambios en configuración, dependencias, etc.

Ejemplo:

```
feat: add CRM onboarding panel for unconfigured companies

- Added LeadCarsConfigComponent onboarding state
- Added CRM awareness to LeadsList and SyncRecords
- Moved console.error handling for 404 status
```

---

## Crear nuevos comandos

Para crear un nuevo comando personalizado:

1. Crea un archivo markdown en este directorio: `mi-comando.md`
2. Añade el frontmatter con configuración:
   ```markdown
   ---
   description: Descripción breve del comando
   agent: general
    model: github-copilot/gpt-5-mini
   ---
   ```
3. Escribe el contenido del comando como prompt

El nombre del archivo se convierte en el nombre del comando (sin la extensión `.md`).

---

## Sintaxis especial

- `` !`comando` `` - Ejecuta comando shell e inyecta el output
- `@archivo` - Incluye contenido del archivo en el prompt
- `$ARGUMENTS` - Reemplaza con argumentos pasados al comando
- `$1`, `$2`, etc. - Argumentos posicionales

---

## Ver también

- [Documentación de comandos de OpenCode](https://opencode.ai/docs/commands)
- [Configuración de OpenCode](..)
