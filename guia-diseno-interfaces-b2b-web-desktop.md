# Guía de Diseño de Interfaces – B2B Web Desktop con Bento UI

Objetivo
- Establecer un lenguaje de diseño coherente, accesible y eficiente para productos B2B en desktop basado en el sistema Bento UI.
- Acelerar la entrega con un sistema de diseño modular tipo grilla, medible y escalable inspirado en las cajas bento japonesas.
- Crear interfaces densas en información pero organizadas y escaneables a través de contenedores modulares.

## Principios

- **Modularidad bento**: cada contenedor es independiente y reutilizable, como las divisiones de una caja bento.
- **Claridad operativa**: priorizar tareas y resultados sobre estética.
- **Densidad controlada**: maximizar información útil sin saturar, usando espacios en blanco estratégicos.
- **Consistencia**: mismas reglas visuales y de interacción en todo el ecosistema.
- **Eficiencia**: minimizar clics, cambios de contexto y carga cognitiva.
- **Jerarquía visual**: tipografía, color y espaciado al servicio de la prioridad de información.
- **Escaneabilidad**: layouts que permiten identificar información rápidamente.
- **Previsibilidad**: patrones reconocibles, sin sorpresas.
- **Accesibilidad primero**: WCAG 2.2 AA como base.
- **Seguridad y privacidad por defecto**.
- **Resiliencia**: tolerancia a errores, vacíos y estados intermedios.

## Accesibilidad (WCAG 2.2 AA)
- Contraste: texto normal ≥ 4.5:1, grande ≥ 3:1; iconos esenciales ≥ 3:1.
- Teclado: navegación completa con tab/shift+tab; foco visible y consistente.
- Roles/ARIA: usar semántica nativa; ARIA solo cuando sea necesario.
- Errores: mensajes claros, asociados al campo, con instrucción de corrección.
- Estados: no depender solo del color; añadir iconos/texto.
- Tamaños: hit area mínima 32×32 px en desktop; espaciado entre objetivos 8 px.
- Lenguaje: atributo lang, lectura por lectores de pantalla coherente.
- Movimiento: respetar prefers-reduced-motion; ofrecer alternativas.
- Documentación: checklist de a11y por componente y por página.

## Sistema de diseño
- Design tokens: color, tipografía, espaciado, radios, sombras, z-index, motion.
- Modos: claro/oscuro con tokens semánticos (surface, on-surface, brand, danger).
- Densidades: cómoda, compacta (controlado por tokens de espaciado).
- Versionado semántico y changelog; compatibilidad hacia atrás documentada.
- Librería de componentes con playground y documentación viva.

## Tipografía
- Familia recomendada: Inter (UI) y Roboto Mono (datos/código), configurables.
- Escala: 12, 14, 16, 18, 20, 24, 28, 32 px; line-height 1.4–1.6.
- Uso:
  - Títulos: H1–H6 con pesos 600–700; 1 título principal por vista.
  - Cuerpo: 14–16 px para lectura; 12–13 px solo para metadatos.
  - Mono: cifras, IDs, columnas numéricas alineadas a la derecha.
- Accesibilidad: evitar texto < 12 px; contraste y espaciado adecuados.

## Iconografía
- Estilo: contorno de 1.5 px, esquinas suaves, tamaños 16/20/24 px.
- Semántica: iconos deben reforzar texto, no reemplazarlo si la acción no es obvia.
- Estados: usar variantes llenas para énfasis en alertas/estados críticos.
- Nombres: verbo-nombre (p. ej., action/download, nav/settings).

## Componentes Bento (estado, tamaños, accesibilidad documentados)

### Componentes Base
- **Entrada de datos**: TextField, TextArea, Number, Masked, Select, Combobox, Date/Time, Checkbox, Radio, Switch, FileUpload, Slider.
- **Acción**: Button (primario, secundario, fantasma, peligro), IconButton, SplitButton.
- **Navegación**: Tabs, Breadcrumbs, Navbar, Sidebar, Pagination, Stepper.
- **Superposición**: Modal, Drawer, Popover, Tooltip.
- **Feedback**: Toast, Snackbar, Inline Alert, Banner, Progress, Skeleton.
- **Datos**: Table/Data Grid (fijo, virtualizado), Empty State, Cards, Tag, Badge, Avatar.
- **Gráficos**: Line/Bar/Pie, KPI, Sparklines, con tooltips accesibles.

### Contenedores Bento Específicos
- **BentoCard**: contenedor base con padding, border-radius, shadow y estados (default, hover, active, disabled).
- **BentoKPI**: widget 1×1 para métricas con número principal, etiqueta, tendencia y mini-gráfico opcional.
- **BentoPanel**: contenedor 2×1 o 2×2 con header, body scrolleable y footer opcional.
- **BentoToolbar**: barra horizontal 3×1 para filtros, búsqueda y acciones.
- **BentoSidelist**: panel vertical 1×3 para navegación, notificaciones o acciones contextuales.
- **BentoWorkspace**: área principal 3×2 para contenido principal, editores o dashboards.
- **BentoGrid**: contenedor que organiza múltiples BentoCards con layout responsive automático.

## Patrones clave
- Autenticación: SSO/OAuth, recuperación, MFA; feedback de errores claro.
- Búsqueda y filtrado: filtros persistentes, chips removibles, guardar vistas.
- CRUD: formularios con validación en vivo, borrado con confirmación segura.
- Tablas B2B: orden, filtro, agrupación, congelar columnas, selección masiva, acciones en lote, exportación.
- Asistentes (Wizard): pasos con resumen y validación por paso.
- Revisión y confirmación: diffs, vista previa, deshacer/rehacer, guardado automático.
- Estados: vacío, carga, error, sin permisos; guías para recuperación.
- Permisos/roles: ocultar acciones no permitidas; feedback cuando aplique.

## Layout Bento

### Sistema de Grilla Bento
- **Grid base**: CSS Grid con áreas nombradas, responsive y fluido.
- **Contenedores bento**: cajas modulares de diferentes tamaños (1×1, 2×1, 1×2, 2×2, 3×1, etc.).
- **Breakpoints desktop**: 1280, 1440, 1600, 1920; mínimo soportado 1280 px.
- **Estructura principal**: Header (64 px), Sidebar (256 px), Área bento fluida, Footer opcional.
- **Espaciado**: escala 4/8 px; gaps consistentes de 16-24px entre contenedores.

### Tipos de Contenedores Bento
- **Widget KPI** (1×1): métrica simple, gráfico pequeño, estado.
- **Tarjeta de datos** (2×1): tabla pequeña, lista, formulario compacto.
- **Panel principal** (2×2): dashboard, gráfico principal, formulario extenso.
- **Barra de herramientas** (3×1): filtros, acciones, breadcrumbs.
- **Lista extensa** (1×3): navegación, menús, notificaciones.
- **Área de trabajo** (3×2): editor, canvas, vista detallada.

### Reglas de Composición
- **Prioridad visual**: tamaños más grandes para información crítica.
- **Agrupación lógica**: contenedores relacionados adyacentes.
- **Flujo de lectura**: patrón Z o F según densidad de información.
- **Responsive**: colapso a columna única en móvil, reorganización automática.
- **Scroll interno**: contenedores individuales con scroll si exceden altura.

## Movimiento
- Duraciones: 100–150 ms (micro), 200–300 ms (transiciones), 400 ms máx.
- Easing: standard (0.2, 0, 0, 1), entrance (0, 0, 0.2, 1), exit (0.4, 0, 1, 1).
- Uso: reforzar jerarquía/estado, nunca bloquear; desactivable con prefers-reduced-motion.

## Datos
- Tablas: alineación numérica a la derecha; truncado con tooltip; copy-to-clipboard.
- Fechas/horas: siempre con zona horaria y formato localizable; timestamps ISO internos.
- Números y moneda: localización, separadores, precisión controlada.
- Carga progresiva: skeletons, placeholders, paginación o virtualización.
- Vacíos: mensaje, contexto y llamada a la acción.

## Internacionalización
- ICU MessageFormat, pluralización y género; no concatenar cadenas.
- Longitudes variables: layouts flexibles; evitar texto incrustado en imágenes.
- Soporte RTL: espejado de iconos y layout; tokens dir-aware.
- Unidades: métricas/imperiales según locale; formatos de fecha y moneda.
- Fallback locales y estrategia de carga diferida de traducciones.

## Repositorio
- Estructura:
  - packages/tokens
  - packages/components
  - packages/icons
  - apps/storybook
  - docs
- Versionado: SemVer; releases automatizadas; changelog por paquete.
- Distribución: npm interno/externo; import treeshakeable y CSS aislado.
- Assets: fuente e iconos versionados; SVGO en CI.

## Calidad
- Lint: estilos, accesibilidad (axe), dependencias.
- Tests: unitarios, visuales (regresión con snapshots/Chromatic), e2e.
- Performance: budgets por componente; tamaño de bundle monitorizado.
- Revisión: checklist de diseño, a11y y contenido en PRs.
- Métricas: adopción por equipo, defectos a11y, NPS interno, tiempo de entrega.

## Plantillas Bento

### Layouts de Página
- **Dashboard ejecutivo**: grid 4×3 con KPIs principales (2×2), métricas secundarias (1×1) y gráfico de tendencia (2×1).
- **Lista + filtros**: toolbar (3×1) + panel filtros (1×2) + lista principal (2×2) + acciones contextuales (1×1).
- **Detalle de entidad**: header info (3×1) + datos principales (2×2) + acciones (1×1) + historial/logs (3×1).
- **Crear/Editar formulario**: steps/breadcrumbs (3×1) + formulario principal (2×3) + preview/validación (1×3).
- **Analytics dashboard**: resumen KPIs (3×1) + gráfico principal (2×2) + comparativas (1×2) + tabla datos (3×1).
- **Workspace operativo**: toolbar (3×1) + navegación (1×3) + área trabajo (2×3).

### Plantillas de Componente
- **Documentación**: propósito, anatomía, estados, variantes, tokens, a11y, ejemplos.
- **Tickets**: plantilla con problema, objetivos, criterios de aceptación, medibles.
- **PRDs**: contexto, usuarios, flujos, métricas, riesgos, señales de éxito.
- **Componente Bento**: API props, slots, eventos, ejemplos de layout, responsive behavior.

## Políticas
- Contribución: RFCs para cambios mayores; revisores obligatorios (diseño/dev/a11y).
- Versionado y deprecación: periodos de solapamiento, guías de migración.
- Accesibilidad: no se publica nada que no cumpla AA.
- Privacidad y seguridad: datos seudonimizados en ambientes no productivos.
- Terceros: evaluación de licencias y mantenimiento; inventario actualizado.
- Marca: uso de color y logo; límites para modo oscuro y estados.

## Adopción
- Gobernanza: comité de diseño; roadmap público; cadencia de releases.
- Integración: kits para Figma y code, ejemplos por stack, CLI de scaffolding.
- Migración: incremental por página; utilidades de compatibilidad; lint rules.
- Formación: sesiones, guías rápidas, office hours; canal de soporte.
- Medición: % de UI con componentes del sistema, time-to-ship, bugs de consistencia.

## Glosario Bento

- **Token**: variable de diseño que define un valor (p. ej., color.surface).
- **Variante**: configuración predefinida de un componente.
- **Densidad**: configuración de espaciado y tamaño para un contexto.
- **Contenedor Bento**: caja modular que ocupa una o más celdas del grid principal.
- **Grid Bento**: sistema de layout basado en CSS Grid con áreas nombradas y tamaños predefinidos.
- **Bento Layout**: composición específica de contenedores bento para una página o funcionalidad.
- **Área de trabajo**: contenedor bento principal donde ocurre la tarea principal del usuario.
- **Widget**: contenedor bento pequeño (1×1) que muestra información específica o acción rápida.
- **Panel**: contenedor bento mediano/grande (2×1, 2×2) con funcionalidad compleja.
- **Toolbar**: contenedor bento horizontal (3×1, 4×1) para acciones y filtros.
- **Responsive Bento**: comportamiento de reorganización automática de contenedores según viewport.

## Implementación Técnica Bento

### CSS Grid Foundation

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  grid-auto-rows: minmax(200px, auto);
  gap: 16px;
  padding: 24px;
}

.bento-card {
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all 200ms ease;
}

/* Tamaños específicos */
.bento-card--1x1 { grid-column: span 1; grid-row: span 1; }
.bento-card--2x1 { grid-column: span 2; grid-row: span 1; }
.bento-card--1x2 { grid-column: span 1; grid-row: span 2; }
.bento-card--2x2 { grid-column: span 2; grid-row: span 2; }
.bento-card--3x1 { grid-column: span 3; grid-row: span 1; }
```

### Directivas Angular

```typescript
@Directive({ selector: '[bentogrid]' })
export class BentoGridDirective {
  @Input() columns: number = 4;
  @Input() gap: string = '16px';
  @Input() minItemWidth: string = '280px';
}

@Component({ selector: 'bento-card' })
export class BentoCardComponent {
  @Input() size: '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | '3x2' = '1x1';
  @Input() title?: string;
  @Input() loading: boolean = false;
  @Input() error?: string;
}
```

### Tokens de Diseño Bento

```scss
// Espaciado
$bento-gap-sm: 12px;
$bento-gap-md: 16px;
$bento-gap-lg: 24px;

// Tamaños mínimos
$bento-min-width: 280px;
$bento-min-height: 200px;

// Radios y sombras
$bento-radius: 12px;
$bento-shadow: 0 1px 3px rgba(0,0,0,0.05);
$bento-shadow-hover: 0 4px 12px rgba(0,0,0,0.1);

// Estados
$bento-border-default: 1px solid var(--border-subtle);
$bento-border-hover: 1px solid var(--border-default);
$bento-border-focus: 2px solid var(--primary-500);
```