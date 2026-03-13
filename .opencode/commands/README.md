# OpenCode Custom Commands

Este directorio contiene comandos personalizados de OpenCode para flujos de trabajo comunes en guiders-frontend.

## Comandos disponibles

### `/publish-develop`

**Descripción**: Publica cambios a la rama develop con análisis completo

**Uso**:

```
/publish-develop
```

**Qué hace**:

1. Muestra el estado actual de git
2. Muestra el diff estadístico de cambios
3. Crea un mensaje de commit significativo
4. Realiza staging de todos los cambios
5. Hace commit con un mensaje descriptivo
6. Hace push a origin/develop
7. Verifica el push exitoso

**Modelo**: GitHub Copilot Claude Haiku 4.5

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
4. Hace push a origin/develop
5. Muestra el commit confirmado

**Modelo**: GitHub Copilot Claude Haiku 4.5

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
   model: github-copilot/claude-haiku-4.5
   ---
   ```
3. Escribe el contenido del comando como prompt

El nombre del archivo se convierte en el nombre del comando (sin la extensión `.md`).

---

## Sintaxis especial

- `!`comando`` - Ejecuta comando shell e inyecta el output
- `@archivo` - Incluye contenido del archivo en el prompt
- `$ARGUMENTS` - Reemplaza con argumentos pasados al comando
- `$1`, `$2`, etc. - Argumentos posicionales

---

## Ver también

- [Documentación de comandos de OpenCode](https://opencode.ai/docs/commands)
- [Configuración de OpenCode](..)
