# Images Directory

## Required Images

### chat-welcome.png

**Location:** `apps/console/public/images/chat-welcome.png`

**Description:** Ilustración mostrada en el estado vacío del chat (cuando no hay conversación seleccionada).

**Dimensions:** Recomendado 2000x936 px o similar proporción (aprox. 2:1)

**Content:** Ilustración colorida de dos personas sosteniendo burbujas de conversación con los colores:
- Azul (#3b82f6)
- Rosa (#f472b6)
- Amarillo (#fbbf24)
- Verde (#34d399)

**Used in:** `libs/chat/ui/chat-welcome-state`

---

## How to Add Images

1. Place the image file in this directory: `apps/console/public/images/`
2. The image will be accessible at runtime via `/images/filename.ext`
3. Reference it in templates using: `src="/images/filename.ext"`
