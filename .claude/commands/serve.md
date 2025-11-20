---
description: Iniciar servidor de desarrollo (console o admin)
argument-hint: [console|admin]
allowed-tools: Bash(npm run serve*), Bash(npm run dev*)
---

# Iniciar Servidor de Desarrollo

Inicia el servidor de desarrollo para la aplicación especificada.

**Argumento recibido:** $1

## Servidores disponibles:

- **console**: `npm run serve` - Puerto 4200 (aplicación de chat)
- **admin**: `npm run serve:admin` - Puerto 4201 (dashboard de analytics)

Por favor ejecuta el comando correspondiente según el argumento proporcionado:
- Si es "console" o está vacío: ejecuta `npm run serve`
- Si es "admin": ejecuta `npm run serve:admin`

Ejecuta el servidor en background para que el usuario pueda seguir trabajando.
