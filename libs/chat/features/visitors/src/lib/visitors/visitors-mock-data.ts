import { Visitor, VisitorTag } from '@guiders-frontend/shared/types';

/**
 * Genera un array de visitantes mockeados para desarrollo y testing
 */
export function generateMockVisitors(count = 100): Visitor[] {
  const visitors: Visitor[] = [];
  
  const firstNames = [
    'Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Diego', 'Carmen', 
    'Miguel', 'Isabel', 'Antonio', 'Rosa', 'José', 'Lucía', 'Francisco',
    'Elena', 'Manuel', 'Patricia', 'Javier', 'Cristina', 'Rafael', 'Sofía',
    'David', 'Marta', 'Sergio', 'Beatriz', 'Fernando', 'Raquel', 'Alberto',
    'Silvia', 'Alejandro', 'Natalia', 'Roberto', 'Pilar', 'Ángel', 'Teresa'
  ];

  const lastNames = [
    'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández',
    'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez',
    'Díaz', 'Cruz', 'Reyes', 'Morales', 'Jiménez', 'Romero', 'Ruiz',
    'Álvarez', 'Castillo', 'Moreno', 'Ortiz', 'Gutiérrez', 'Vargas'
  ];

  const domains = [
    'ejemplo.com', 'empresa.es', 'tienda-online.com', 'negocio.mx',
    'corporacion.com', 'startup.io', 'tech-company.com', 'ecommerce.es',
    'services.com', 'consulting.es', 'digital.mx', 'innovation.io'
  ];

  const statuses: ('online' | 'offline' | 'idle')[] = ['online', 'offline', 'idle'];
  
  const lifecycles: ('ANON' | 'ENGAGED' | 'LEAD' | 'CONVERTED')[] = 
    ['ANON', 'ENGAGED', 'LEAD', 'CONVERTED'];

  const devices = ['desktop', 'mobile', 'tablet'];
  
  const countries = ['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC'];
  
  const cities = [
    'Madrid', 'Barcelona', 'Ciudad de México', 'Buenos Aires', 'Santiago',
    'Bogotá', 'Lima', 'Valencia', 'Sevilla', 'Monterrey', 'Guadalajara'
  ];

  const tagNames = [
    'premium', 'vip', 'interested', 'follow-up', 'hot-lead', 'demo-requested',
    'pricing-check', 'support', 'technical', 'sales', 'returning'
  ];

  const tagCategories = ['engagement', 'priority', 'intent', 'support', 'sales'];

  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = Math.random() > 0.3 ? `${firstName} ${lastName}` : undefined;
    const hasEmail = Math.random() > 0.4;
    const hasPhone = Math.random() > 0.6;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const lifecycle = lifecycles[Math.floor(Math.random() * lifecycles.length)];
    const hasActiveChat = Math.random() > 0.7;
    const isNewVisitor = Math.random() > 0.8;
    
    // Generar fecha de última visita (últimos 30 días)
    const lastVisitDate = new Date();
    lastVisitDate.setDate(lastVisitDate.getDate() - Math.floor(Math.random() * 30));
    lastVisitDate.setHours(Math.floor(Math.random() * 24));
    lastVisitDate.setMinutes(Math.floor(Math.random() * 60));

    // Generar fecha de primera visita (entre 1-180 días atrás)
    const firstVisitDate = new Date();
    firstVisitDate.setDate(firstVisitDate.getDate() - Math.floor(Math.random() * 180 + 1));

    // Generar chats pendientes para algunos visitantes
    const pendingCount = Math.random() > 0.85 ? Math.floor(Math.random() * 3) + 1 : 0;
    const pendingChatIds = pendingCount > 0 
      ? Array.from({ length: pendingCount }, (_, idx) => `chat-pending-${i}-${idx + 1}`)
      : undefined;

    // Seleccionar tags aleatorios
    const visitorTags: VisitorTag[] = Math.random() > 0.6
      ? Array.from(
          { length: Math.floor(Math.random() * 3) + 1 },
          (_, tagIdx) => {
            const tagName = tagNames[Math.floor(Math.random() * tagNames.length)];
            return {
              id: `tag-${i}-${tagIdx}`,
              name: tagName,
              category: tagCategories[Math.floor(Math.random() * tagCategories.length)],
              confidence: Math.random() > 0.5 ? Math.random() * 0.3 + 0.7 : undefined,
              addedAt: new Date(),
              addedBy: ['system', 'commercial', 'ai'][Math.floor(Math.random() * 3)] as 'system' | 'commercial' | 'ai'
            };
          }
        )
      : [];

    const visitor: Visitor = {
      id: `visitor-${i.toString().padStart(4, '0')}`,
      sessionId: `session-${i.toString().padStart(4, '0')}-${Date.now()}`,
      domain: domains[Math.floor(Math.random() * domains.length)],
      siteId: `site-${Math.floor(Math.random() * 3) + 1}`,
      companyId: `company-${Math.floor(Math.random() * 2) + 1}`,
      name,
      email: hasEmail ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}` : undefined,
      phone: hasPhone ? `+34 ${Math.floor(Math.random() * 900 + 600)} ${Math.floor(Math.random() * 900000 + 100000)}` : undefined,
      status,
      lifecycle,
      hasActiveChat,
      isNewVisitor,
      lastVisit: lastVisitDate,
      firstVisit: firstVisitDate,
      currentUrl: `/${['', 'products', 'about', 'contact', 'pricing', 'blog', 'services'][Math.floor(Math.random() * 7)]}`,
      referrer: Math.random() > 0.5 ? `https://google.com/search?q=query${i}` : undefined,
      userAgent: `Mozilla/5.0 (${devices[Math.floor(Math.random() * devices.length)]}) AppleWebKit/537.36`,
      country: countries[Math.floor(Math.random() * countries.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      totalChats: Math.floor(Math.random() * 10),
      totalPageViews: Math.floor(Math.random() * 50) + 1,
      totalSessions: Math.floor(Math.random() * 20) + 1,
      averageSessionDuration: Math.floor(Math.random() * 3600), // segundos
      tags: visitorTags,
      pendingChatIds
    };

    visitors.push(visitor);
  }

  // Ordenar por última visita (más reciente primero)
  return visitors.sort((a, b) => 
    new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
  );
}

/**
 * Mock de respuesta del servicio de visitantes
 */
export function getMockVisitorsResponse(limit = 20, offset = 0) {
  const allVisitors = generateMockVisitors(100);
  const paginatedVisitors = allVisitors.slice(offset, offset + limit);

  return {
    visitors: paginatedVisitors,
    total: allVisitors.length,
    hasMore: offset + limit < allVisitors.length
  };
}

/**
 * Mock de estadísticas de visitantes
 */
export function getMockVisitorStats() {
  const allVisitors = generateMockVisitors(100);
  
  return {
    totalVisitors: allVisitors.length,
    onlineVisitors: allVisitors.filter(v => v.status === 'online').length,
    newVisitors: allVisitors.filter(v => v.isNewVisitor).length,
    returningVisitors: allVisitors.filter(v => !v.isNewVisitor).length,
    withPendingChats: allVisitors.filter(v => v.pendingChatIds && v.pendingChatIds.length > 0).length,
    averageSessionDuration: Math.floor(
      allVisitors.reduce((sum, v) => sum + v.averageSessionDuration, 0) / allVisitors.length
    ),
    bounceRate: 0.35, // 35% tasa de rebote
    conversionRate: 0.12, // 12% tasa de conversión
    topPages: [
      { url: '/products', title: 'Productos', views: 1250 },
      { url: '/pricing', title: 'Precios', views: 980 },
      { url: '/about', title: 'Acerca de', views: 750 },
      { url: '/contact', title: 'Contacto', views: 650 },
      { url: '/blog', title: 'Blog', views: 520 }
    ],
    topSources: [
      { source: 'Google', visitors: 450 },
      { source: 'Direct', visitors: 320 },
      { source: 'LinkedIn', visitors: 180 },
      { source: 'Facebook', visitors: 120 },
      { source: 'Twitter', visitors: 80 }
    ]
  };
}
