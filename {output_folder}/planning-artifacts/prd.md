---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: ['{output_folder}/project-context.md']
workflowType: 'prd'
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 1
classification:
  projectType: 'SaaS B2B Web Application'
  domain: 'Automoción / CRM + Live Chat para concesionarios'
  complexity: 'media-alta'
  projectContext: 'brownfield'
---

# Documento de Requisitos del Producto — guiders-frontend

**Autor:** Roger Puga  
**Fecha:** 2026-04-01

## Resumen Ejecutivo

guiders es una plataforma SaaS B2B de chat proactivo con inteligencia de comportamiento para concesionarios de automoción. Permite a los equipos comerciales identificar, perfilar y contactar proactivamente a los visitantes de su web en el momento de máximo interés — antes de que el cliente abandone o acuda a la competencia.

El sistema transforma la web del concesionario de un canal pasivo en un canal de venta activo: el comercial ve en tiempo real qué vehículos está mirando cada visitante, con qué frecuencia, cuánto tiempo, y con qué historial de visitas previas. Con ese perfil completo, inicia la conversación desde una posición de ventaja: sabe qué ofrecer antes de decir hola.

El producto está dirigido a dos perfiles: **agentes comerciales** (usuarios primarios de la consola) y **supervisores/administradores** (usuarios del panel admin). El problema central: la dependencia del proceso de venta de automoción en la presencia física. Hoy, el concesionario no puede vender desde la web porque no tiene inteligencia sobre el visitante ni herramientas para actuar sobre ella en tiempo real.

### Lo Que Lo Hace Especial

**Heat Index de intención de compra:** Cada visitante tiene una puntuación calculada a partir de eventos de tracking (vehículos visualizados, tiempo en ficha, visitas recurrentes). La lista de visitantes se ordena por ese índice — el comercial trabaja siempre al visitante con mayor probabilidad de compra.

**Perfil contextual en tiempo real:** Al abrir el perfil de un visitante, el agente no ve un nombre y un email — ve el historial completo: qué modelos ha visto, cuántas veces, en qué orden, en visitas anteriores y en la visita actual. El contexto está construido antes de que empiece la conversación.

**Posición competitiva:** Las soluciones actuales caen en dos categorías sin solución para guiders:

| Categoría                | Ejemplos                 | Limitación                                                            |
| ------------------------ | ------------------------ | --------------------------------------------------------------------- |
| Live chat genérico       | Intercom, Zendesk, Crisp | Sin tracking de comportamiento de producto; configuración superficial |
| CRM sectorial automoción | LeadCars, DealerSocket   | Sin canal de chat proactivo en tiempo real; operan post-lead          |
| Chat para e-commerce     | Tidio, Gorgias           | Tracking de productos, pero modelo reactivo (el cliente inicia)       |

guiders ocupa el hueco entre estas categorías: inteligencia de comportamiento de producto + proactividad del agente + integración nativa con el CRM sectorial.

## Criterios de Éxito

### Éxito del Usuario

- El agente comercial abre la consola y en menos de 10 segundos identifica al visitante con mayor intención de compra (heat index visible, lista ordenada)
- Al abrir el perfil de un visitante, el agente ve qué vehículos ha visto, cuántas veces y en qué orden — sin tener que preguntar al visitante
- El agente puede iniciar una conversación proactiva con ese contexto ya cargado
- Los leads se sincronizan automáticamente en LeadCars al cambiar el lifecycle del visitante — sin ninguna acción manual del agente

### Éxito del Negocio

- **Leads generados desde la web**: al menos 1 lead por semana creado en LeadCars originado desde una conversación proactiva (medible en los primeros 30 días con el cliente/socio)
- **Tasa de conversación proactiva**: >30% de los chats iniciados son proactivos (agente → visitante)
- **Tasa de creación de leads**: >50% de las conversaciones completadas generan un lead sincronizado en LeadCars sin errores
- **Time-to-contact**: el agente contacta al visitante mientras está en la web activo — no después de que se haya ido

### Éxito Técnico

- Pipeline de tracking funcional de extremo a extremo: SDK → `POST /tracking-v2/events` → MongoDB → consulta desde frontend en < 2s
- Integración LeadCars con tasa de error < 5% en sincronización de leads (medida por `sync-records/failed`)
- El endpoint de visualizaciones de producto responde en < 500ms para el perfil de visitante
- El sistema funciona en modo multi-tenant sin filtrado de datos entre concesionarios

### Resultados Medibles

- Reducción del tiempo medio de respuesta del agente: de reactivo/nulo a < 3 minutos en visitas activas de alta intención
- 0 sincronizaciones manuales de leads a LeadCars (100% automáticas)
- Cobertura de datos de producto: >80% de los visitantes activos con al menos 1 evento `PRODUCT_VIEW` registrado en su perfil

## User Journeys

### Journey 1 — Agente Comercial: Ruta del Éxito

**Conoce a Carlos.** Carlos lleva 4 años vendiendo coches. Es bueno en el cara a cara, pero la web es un canal ciego: sabe que hay gente mirando coches, pero no puede hacer nada con eso. Hoy empieza a usar guiders.

**Lunes, 9:15am.** Carlos abre la consola. La lista de visitantes activos está ordenada por heat index. En el primer puesto: un visitante anónimo con puntuación 87/100. Ha visitado el sitio 3 veces esta semana, ha visto el mismo SUV cinco veces, y lleva 8 minutos en la ficha en este momento.

**9:17am.** Carlos abre el perfil. Ve el historial completo: en la primera visita miró 4 coches distintos; en la segunda volvió al mismo SUV y al sedán familiar; hoy solo está mirando el SUV. Interpreta la señal: está decidiendo. Hace clic en "Iniciar chat".

**9:18am.** Carlos envía: _"Buenos días, veo que llevas un tiempo mirando el X5. ¿Te puedo ayudar con alguna duda sobre las versiones disponibles?"_ El visitante responde en 30 segundos. La conversación fluye. El visitante acepta una visita para el jueves.

**Resultado.** Carlos ha contactado a alguien que estaba a punto de irse, en el momento exacto de máximo interés, con todo el contexto ya preparado. El visitante pasa automáticamente a lifecycle LEAD y se sincroniza en LeadCars. Carlos no ha tocado ningún CRM — solo ha hablado.

**Requisitos revelados:** Lista de visitantes con heat index ordenable, perfil de visitante con historial de productos vistos, botón de chat proactivo desde el perfil, sincronización automática de leads a LeadCars.

---

### Journey 2 — Agente Comercial: Ruta con Fallo y Recuperación

**Son las 11am.** Carlos tiene 3 visitantes activos. Abre el segundo de la lista (puntuación 72). El perfil carga, pero la sección de "vehículos vistos" muestra "Sin datos de tracking". El SDK no ha registrado eventos `PRODUCT_VIEW` para este visitante — probablemente llegó desde un enlace directo y el SDK aún no estaba inicializado.

**Carlos no se queda bloqueado.** Tiene el lifecycle (ENGAGED — lleva 12 minutos en el sitio), la URL actual (ficha del Tiguan), y el origen (Google Ads). Inicia el chat con lo que tiene: _"Hola, ¿estás buscando información sobre el Tiguan?"_

**Requisitos revelados:** Empty states informativos en el panel de productos, datos de fallback visibles (URL actual, origen, tiempo en sesión), graceful degradation del heat index cuando los datos son parciales.

---

### Journey 3 — Supervisor/Admin: Diagnóstico LeadCars

**Conoce a Ana.** Ana es la directora comercial. Esta semana le han dicho que algunos leads no están llegando a LeadCars. Va al panel admin.

**Ana abre la sección de integración CRM.** Ve el estado de la conexión LeadCars: último sync hace 3 días. Hay 14 registros en `sync-records/failed`. Abre el detalle: el error es `concesionario_id inválido` — alguien cambió la configuración y el ID no coincide con producción (estaban usando sandbox).

**Ana corrige la configuración** — actualiza el `concesionario_id` y cambia `useSandbox: false`. Pulsa "Probar conexión" y obtiene un check verde. Los 14 registros fallidos se reintentan manualmente.

**Resultado.** Ana no necesita abrir un ticket técnico. El panel le da visibilidad del problema y las herramientas para corregirlo.

**Requisitos revelados:** Panel admin de estado de integración LeadCars (conexión, último sync, registros fallidos), formulario de configuración (clienteToken, concesionarioId, sedeId, useSandbox), botón de test de conexión, reintento de sync records fallidos.

---

### Journey 4 — Visitante Web (Actor del SDK)

**Conoce a Miguel.** Miguel, 42 años, lleva dos semanas mirando webs de concesionarios. No quiere ir en persona hasta tener claro qué quiere. Hoy entra en la web del concesionario por tercera vez.

El SDK de guiders carga silenciosamente. Cuando Miguel abre la ficha del Seat Ateca, el SDK emite un evento `PRODUCT_VIEW` con el ID del vehículo, el título de la página, y el timestamp. No hay nada visible para Miguel.

**5 minutos después** aparece un pequeño chat. _"Hola Miguel, ¿puedo ayudarte con el Ateca?"_ Miguel se sorprende: el comercial ya sabe el modelo. Responde.

**Requisitos revelados:** SDK con `PRODUCT_VIEW` que envía productId, productName, productUrl en metadata. La inteligencia está del lado del agente — el visitante solo ve un chat estándar.

---

### Resumen de Requisitos por Journey

| Capacidad                         | Journey 1 | Journey 2 | Journey 3 | Journey 4 |
| --------------------------------- | :-------: | :-------: | :-------: | :-------: |
| Lista visitantes con heat index   |     ✓     |     ✓     |           |           |
| Perfil con historial de productos |     ✓     |     ✓     |           |           |
| Empty states y fallback data      |           |     ✓     |           |           |
| Chat proactivo desde perfil       |     ✓     |     ✓     |           |           |
| Sync automático a LeadCars        |     ✓     |           |     ✓     |           |
| Panel admin estado LeadCars       |           |           |     ✓     |           |
| Config LeadCars + test conexión   |           |           |     ✓     |           |
| Reintento de sync fallidos        |           |           |     ✓     |           |
| SDK PRODUCT_VIEW con metadata     |           |           |           |     ✓     |

## Requisitos de Dominio

### Privacidad y GDPR

- El SDK gestiona consentimiento GDPR completo (`requireConsent`, consent banner, `bypassConsent` solo en desarrollo). No se registran eventos hasta que el visitante otorga consentimiento.
- No se almacena PII en eventos de tracking — solo UUIDs de visitante/sesión y metadata estructurada (URLs, IDs de producto).
- El concesionario es responsable de su política de cookies; guiders actúa como procesador de datos según RGPD.
- Las credenciales de LeadCars (`clienteToken`) se almacenan exclusivamente en el backend — nunca en el frontend ni en el SDK.

### Aislamiento Multi-Tenant

- Cada concesionario opera con su propio `tenantId` y `siteId`. Los agentes solo acceden a visitantes de su tenant.
- El backend garantiza el filtrado a nivel de API; la UI no expone datos entre tenants bajo ninguna circunstancia.
- La configuración del tenant (credenciales LeadCars, pesos del heat index, mapeo de campos) se gestiona en el backend y se consume vía API.

### Integración LeadCars — Entornos

- La integración soporta `sandbox` (apisandbox.leadcars.es) y `producción` (api.leadcars.es). La configuración es por tenant.
- La corrección de la integración LeadCars es prioritaria si el cliente/socio opera en producción.

## Arquitectura Multi-Tenant y Roles

### Modelo de Tenant

- Cada tenant se identifica por `tenantId` + `siteId` (dominio del concesionario)
- La configuración del tenant incluye: credenciales LeadCars, pesos del heat index, umbrales de alerta, mapeo de campos de lead, y branding
- Onboarding de un nuevo tenant: registro en guiders → instalación del SDK → configuración de LeadCars

### Matriz de Roles y Permisos (RBAC)

| Capacidad                                          | Agente | Supervisor | Super Admin |
| -------------------------------------------------- | :----: | :--------: | :---------: |
| Ver lista de visitantes activos                    |   ✓    |     ✓      |      ✓      |
| Abrir perfil de visitante (historial + heat index) |   ✓    |     ✓      |      ✓      |
| Iniciar chat proactivo                             |   ✓    |     ✓      |      —      |
| Ver métricas del equipo / analytics                |   —    |     ✓      |      ✓      |
| Configurar heat index (pesos por evento)           |   —    |     ✓      |      ✓      |
| Configurar umbrales de alerta                      |   —    |     ✓      |      ✓      |
| Configurar integración LeadCars                    |   —    |     ✓      |      ✓      |
| Gestionar usuarios y agentes del tenant            |   —    |     ✓      |      ✓      |
| Configurar branding / white-label                  |   —    |     ✓      |      ✓      |
| Gestionar tenants (multi-concesionario)            |   —    |     —      |      ✓      |

- **Agente**: acceso operativo completo a la consola (visitantes, perfiles, chats). Sin acceso a configuración.
- **Supervisor**: todo lo del agente + configuración completa del tenant. Es el administrador del concesionario.
- **Super Admin**: rol interno del equipo guiders. Gestión de plataforma, acceso a todos los tenants. Sin interfaz dedicada en el MVP.

> Nota: El MVP puede simplificar a solo Agente + Supervisor. RBAC completo en Fase 3.

### Integraciones

| Integración             | Estado               | Alcance MVP                                           |
| ----------------------- | -------------------- | ----------------------------------------------------- |
| **LeadCars CRM**        | Existente (con bugs) | Diagnóstico, corrección y panel de estado             |
| **guiders SDK**         | Producción (v1.5.3)  | Consumir eventos `PRODUCT_VIEW` — no modificar el SDK |
| **tracking-v2 backend** | Existente            | Nuevo endpoint de productos vistos por visitante      |

## Innovación y Diferenciación

### Heat Index Configurable por Tenant

La mayoría de herramientas de live chat no tienen scoring o usan scores fijos. guiders introduce un motor de puntuación de comportamiento en el que cada concesionario configura los pesos desde el panel admin: cuánto vale un `PRODUCT_VIEW`, cuánto una visita recurrente, cuánto el tiempo acumulado en ficha.

El scoring es determinista y auditable (motor de reglas, no caja negra), lo que permite al equipo comercial entender y confiar en el índice — factor crítico para la adopción en entornos B2B conservadores como la automoción.

### Plataforma Adaptable al Proceso de Venta

Las dimensiones de adaptabilidad por tenant:

- **Campos de lead personalizados**: mapeo configurable de datos de visitante/conversación a los campos del CRM LeadCars del concesionario
- **Umbrales de alerta configurables**: el agente recibe notificaciones cuando un visitante supera el heat score que el equipo ha definido como "momento de actuar"
- **Pesos de tracking personalizables**: qué eventos cuentan y con qué peso en el heat index del tenant
- **Flujos de asignación de chats**: enrutamiento a agentes según modelo visto, franja horaria, o disponibilidad
- **Branding/white-label**: la interfaz adapta identidad visual al concesionario

### Validación de la Hipótesis Central

- **Hipótesis**: el agente que ve qué vehículo está mirando el visitante inicia más conversaciones y con mayor tasa de conversión que el agente que espera el primer mensaje
- **Validación en 30 días con cliente/socio**: medir % de chats proactivos vs reactivos, y tasa de conversión a lead por tipo de inicio
- **Umbral mínimo**: >30% de chats proactivos, >1 lead/semana desde chat proactivo

## Alcance y Roadmap

### MVP — Funcionalidades Imprescindibles (Fase 1)

**Journeys cubiertos:** Journey 1 + Journey 2 + Journey 3

| #   | Capacidad                                                  | Justificación                                               |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | Endpoint backend: productos vistos por visitante           | Desbloqueante técnico — sin él no hay UI que construir      |
| 2   | Panel de vehículos vistos en el perfil del visitante       | Core del valor — el agente ve qué está mirando el visitante |
| 3   | Heat Index en `VisitorCard` y lista ordenable              | El agente necesita saber a quién contactar primero          |
| 4   | Corrección integración LeadCars + panel de estado en admin | Sin leads en el CRM no hay valor de negocio demostrable     |

**Fuera del MVP (explícitamente):**

- Heat index configurable por tenant — MVP usa pesos por defecto; configurabilidad en Fase 2
- WebSocket en tiempo real — polling suficiente para validar el comportamiento del agente
- Reintento automático de sync records fallidos — panel de visibilidad sí; reintento automático en Fase 2

### Post-MVP (Fase 2 — Crecimiento)

Una vez validado el cambio de comportamiento del agente:

- Configuración del heat index por tenant desde el admin (pesos por evento)
- Actualización en tiempo real del perfil de visitante vía WebSocket
- Alertas al agente cuando un visitante de alta puntuación entra al sitio
- Reintento automático de sync records fallidos en LeadCars
- Configuración completa de LeadCars desde el admin (concesionario, sede, campaña)

### Expansión (Fase 3)

Una vez validado con más de un cliente:

- Dashboard de analytics para supervisores (vehículos más vistos, funnel web → lead → visita)
- Motor de scoring configurable: el concesionario define qué eventos valen más puntos
- SDK WordPress plugin productizado e integrado en onboarding
- RBAC completo y branding/white-label por tenant

### Riesgos y Mitigaciones

| Riesgo                                          | Probabilidad | Impacto | Mitigación                                                                       |
| ----------------------------------------------- | ------------ | ------- | -------------------------------------------------------------------------------- |
| Endpoint PRODUCT_VIEW no existe en backend      | Confirmado   | Alto    | Primera tarea del sprint; desbloqueante del MVP                                  |
| Integración LeadCars más rota de lo esperado    | Media        | Alto    | Diagnóstico exhaustivo antes de estimar — leer `sync-records/failed` y logs      |
| SDK no instalado en la web del cliente/socio    | Media        | Medio   | Verificar instalación antes de construir la UI                                   |
| El agente no cambia su comportamiento           | Media        | Alto    | Observación directa con el cliente/socio en las primeras semanas                 |
| El heat index no refleja la intención real      | Media        | Medio   | Pesos por defecto simples y transparentes; configurabilidad en Fase 2            |
| Scope se expande durante el desarrollo          | Media        | Medio   | Congelar el scope MVP; nuevas ideas van a lista de Fase 2                        |
| Bug de LeadCars consume más tiempo del esperado | Media        | Medio   | Timeboxear el diagnóstico a 1 jornada; si no se resuelve, documentar y escalar   |
| El agente no confía en el heat index            | Media        | Medio   | Motor de reglas transparente; el agente ve los eventos que generan la puntuación |

## Requisitos Funcionales

### Perfil e Inteligencia de Visitante

- **FR1:** El sistema calcula un heat index de intención de compra para cada visitante a partir de sus eventos de comportamiento
- **FR2:** El agente puede ver el heat index de un visitante en la tarjeta de la lista de visitantes
- **FR3:** El agente puede ordenar la lista de visitantes por heat index
- **FR4:** El agente puede ver el historial completo de vehículos vistos por un visitante en su perfil (vehículo, número de visualizaciones, última vez visto)
- **FR5:** El sistema diferencia los vehículos vistos en la sesión actual de los vistos en sesiones anteriores
- **FR6:** El sistema muestra un empty state informativo cuando no hay eventos de producto registrados para un visitante
- **FR7:** El sistema muestra datos de contexto alternativos (URL actual, origen del tráfico, tiempo en sesión) cuando no hay historial de productos disponible
- **FR8:** El agente puede ver en el perfil los eventos de comportamiento que componen el heat index del visitante

### Gestión de Visitantes

- **FR9:** El agente puede ver la lista de visitantes activos
- **FR10:** El agente puede filtrar la lista de visitantes por lifecycle (nuevo, engaged, lead, etc.)
- **FR11:** El agente puede abrir el perfil detallado de cualquier visitante desde la lista
- **FR12:** El sistema muestra por cada visitante su lifecycle actual, URL activa, origen de la visita y tiempo en sesión
- **FR13:** El sistema actualiza el estado de los visitantes activos de forma periódica

### Chat Proactivo

- **FR14:** El agente puede iniciar una conversación con un visitante directamente desde su perfil
- **FR15:** El agente puede ver el historial de conversaciones anteriores con un visitante dentro de su perfil
- **FR16:** El sistema presenta el contexto del visitante (heat index + vehículos vistos) antes de que el agente envíe el primer mensaje

### Integración con LeadCars

- **FR17:** El sistema sincroniza automáticamente un lead en LeadCars cuando un visitante cambia su lifecycle a LEAD
- **FR18:** El sistema sincroniza automáticamente los datos de la conversación en LeadCars al cerrar un chat
- **FR19:** El supervisor puede ver el estado de la conexión con LeadCars (activa, error, fecha del último sync)
- **FR20:** El supervisor puede ver la lista de registros de sincronización fallidos con detalle del error
- **FR21:** El supervisor puede reintentar manualmente la sincronización de registros fallidos
- **FR22:** El supervisor puede configurar las credenciales de la integración LeadCars (token, ID de concesionario, entorno)
- **FR23:** El supervisor puede probar la conexión con LeadCars y obtener el resultado inmediatamente

### Configuración del Tenant

- **FR24:** El supervisor puede configurar los pesos de los eventos de comportamiento en el cálculo del heat index _(Fase 2)_
- **FR25:** El supervisor puede configurar el umbral de heat score que dispara notificaciones al agente _(Fase 2)_
- **FR26:** El supervisor puede configurar el mapeo de campos de lead hacia LeadCars _(Fase 2)_
- **FR27:** El supervisor puede gestionar los usuarios y agentes del tenant _(Fase 2)_
- **FR28:** El supervisor puede configurar el branding visual de la plataforma para su tenant _(Fase 3)_

### Autenticación y Control de Acceso

- **FR29:** El usuario puede autenticarse en la plataforma con sus credenciales
- **FR30:** El sistema restringe las funciones de configuración a usuarios con rol Supervisor
- **FR31:** El sistema restringe el acceso a datos de visitantes y conversaciones al tenant del usuario autenticado

### Tracking y Datos de Comportamiento

- **FR32:** El backend expone los eventos de producto de un visitante como una lista consultable por su identificador
- **FR33:** El sistema consume eventos `PRODUCT_VIEW` del módulo de tracking para construir el perfil de comportamiento del visitante
- **FR34:** El sistema calcula el heat index combinando múltiples señales: visualizaciones de producto, tiempo en página, frecuencia de visitas
- **FR35:** El SDK registra eventos `PRODUCT_VIEW` con los metadatos del vehículo (ID, nombre, URL) cuando el visitante otorga consentimiento
- **FR36:** El sistema garantiza que los datos de tracking y las conversaciones de un tenant no son accesibles desde otro tenant

> **Alcance MVP:** FR1–FR23 y FR29–FR36. Las capacidades marcadas _(Fase 2)_ y _(Fase 3)_ forman parte del contrato total del producto pero están fuera del MVP.

## Requisitos No-Funcionales

### Rendimiento

Los tiempos de respuesta son críticos para el modelo proactivo: si el perfil tarda en cargar, el agente pierde el momento de contacto.

- **NFR1:** El perfil de visitante (incluyendo historial de vehículos vistos y heat index) carga en < 2 segundos desde la apertura
- **NFR2:** El endpoint de productos vistos por visitante responde en < 500ms bajo carga normal
- **NFR3:** La lista de visitantes activos se actualiza en intervalos de ≤ 30 segundos
- **NFR4:** El panel de administración de LeadCars (estado + registros fallidos) carga en < 2 segundos
- **NFR5:** Las acciones del agente (iniciar chat, abrir perfil) tienen respuesta visual inmediata (< 200ms) aunque los datos tarden más en cargar

### Seguridad

- **NFR6:** Todos los endpoints de API requieren autenticación mediante Bearer token válido
- **NFR7:** Las credenciales de LeadCars (`clienteToken`) se almacenan exclusivamente en el backend — nunca en el frontend ni en el SDK
- **NFR8:** Toda la comunicación entre cliente y servidor viaja encriptada (HTTPS/TLS)
- **NFR9:** Las sesiones de usuario expiran automáticamente tras un período de inactividad
- **NFR10:** El backend valida que cada petición solo accede a datos del tenant del usuario autenticado — no existe ruta para acceder a datos de otro tenant

### Escalabilidad

- **NFR11:** La arquitectura multi-tenant soporta la incorporación de nuevos tenants sin cambios de código ni despliegues especiales
- **NFR12:** El módulo tracking-v2 procesa batches de hasta 500 eventos sin degradación de rendimiento
- **NFR13:** El sistema mantiene funcionamiento normal con hasta 100 visitantes activos simultáneos por tenant en la fase MVP

### Accesibilidad

- **NFR14:** La interfaz cumple WCAG 2.2 nivel AA para todas las funcionalidades del agente
- **NFR15:** La consola es completamente navegable por teclado (lista de visitantes, perfil, inicio de chat)
- **NFR16:** Los componentes interactivos tienen estados de foco visibles y etiquetas accesibles para lectores de pantalla

### Fiabilidad de la Integración

- **NFR17:** La integración con LeadCars implementa reintentos automáticos con backoff exponencial ante errores transitorios
- **NFR18:** Los registros de sincronización fallidos se persisten de forma duradera y son recuperables manualmente desde el panel admin
- **NFR19:** El sistema detecta y reporta un fallo de conexión con LeadCars en el panel admin en < 60 segundos desde que ocurre
- **NFR20:** Un fallo en la integración LeadCars no interrumpe ni degrada la funcionalidad de chat y perfiles de visitante
