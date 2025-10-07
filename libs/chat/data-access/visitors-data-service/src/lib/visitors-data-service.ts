import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { SessionService } from '@guiders-frontend/auth/data-access/session';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { 
  Visitor, 
  GetVisitorsResponse,
  GetTenantVisitorsResponse,
  GetVisitorResponse,
  GetVisitorSessionsResponse,
  CreateChatWithVisitorRequest,
  CreateChatWithVisitorResponse,
  IdentifyVisitorRequest,
  IdentifyVisitorResponse,
  HeartbeatRequest,
  HeartbeatResponse,
  EndSessionRequest,
  EndSessionResponse,
  VisitorStats,
  Chat,
  GetChatsResponse
} from '@guiders-frontend/shared/types';

interface VisitorQueryParams {
  limit?: number;
  offset?: number;
  status?: string;
  search?: string;
  includeOffline?: boolean;
}



@Injectable({
  providedIn: 'root'
})
export class VisitorsDataService {
  private readonly http = inject(HttpClient);
  private readonly sessionService = inject(SessionService);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly baseUrl = `${this.environment.api.baseUrl}`;

  // Función para obtener el token de acceso
  private getAccessToken(): string | null {
    return localStorage.getItem('access-token');
  }

  // Obtener visitantes con filtros y paginación usando tenant-visitors endpoint
  getVisitors(tenantId: string, params: VisitorQueryParams = {}): Observable<GetVisitorsResponse> {
    const { limit = 10, offset = 0, status, search, includeOffline } = params;
    
    let queryParams = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
      
    if (status) {
      queryParams = queryParams.set('status', status);
    }
    
    if (search) {
      queryParams = queryParams.set('search', search);
    }
    
    if (includeOffline !== undefined) {
      queryParams = queryParams.set('includeOffline', includeOffline.toString());
    }

    // Usar el endpoint tenant-visitors con el ID de la empresa obtenido de /api/me/company
    console.log(`[VisitorsDataService] Calling API: ${this.baseUrl}/tenant-visitors/${tenantId}/visitors`);
    console.log('[VisitorsDataService] Query params:', queryParams.toString());
    
    // Usar cookies BFF para autenticación (no token manual)
    const options = { 
      params: queryParams,
      withCredentials: true // Usa las cookies BFF automáticamente
    };
    
    return this.http.get<GetTenantVisitorsResponse>(`${this.baseUrl}/tenant-visitors/${tenantId}/visitors`, options)
      .pipe(
        tap(response => console.log('[VisitorsDataService] Raw API Response:', response)),
        map(response => {
          // Mapear la respuesta del tenant-visitors al formato GetVisitorsResponse
          const mappedVisitors: Visitor[] = response.visitors.map(apiVisitor => ({
            id: apiVisitor.id,
            fingerprint: apiVisitor.fingerprint,
            lifecycle: 'ANON' as const, // Valor por defecto
            isNewVisitor: false, // Se puede calcular basado en createdAt
            status: apiVisitor.connectionStatus === 'ONLINE' ? 'online' as const : 'offline' as const,
            domain: apiVisitor.siteName,
            siteId: apiVisitor.siteId,
            tenantId: response.tenantId,
            firstVisit: new Date(apiVisitor.createdAt),
            lastVisit: new Date(apiVisitor.lastActivity),
            totalSessions: 1, // Valor por defecto
            totalPageViews: 0, // Valor por defecto
            averageSessionDuration: 0, // Valor por defecto
            hasActiveChat: false, // Valor por defecto
            totalChats: 0, // Valor por defecto
            pendingChatIds: apiVisitor.pendingChatIds || [] // ¡IMPORTANTE! Mapear los chats pendientes del backend
          }));

          const mappedResponse: GetVisitorsResponse = {
            visitors: mappedVisitors,
            total: response.totalCount,
            hasMore: false, // No hay paginación en este endpoint
            nextCursor: undefined
          };

          console.log('[VisitorsDataService] Mapped Response:', mappedResponse);
          return mappedResponse;
        }),
        catchError(error => {
          console.error('[VisitorsDataService] Error:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener visitante por ID
  getVisitorById(visitorId: string): Observable<GetVisitorResponse> {
    return this.http.get<GetVisitorResponse>(
      `${this.baseUrl}/visitors/${visitorId}`,
      { withCredentials: true }
    );
  }

  // Obtener sesiones de un visitante
  getVisitorSessions(
    visitorId: string,
    limit = 10,
    includeActive = true
  ): Observable<GetVisitorSessionsResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('includeActive', includeActive.toString());

    return this.http.get<GetVisitorSessionsResponse>(
      `${this.baseUrl}/visitors/${visitorId}/sessions`,
      { params, withCredentials: true }
    );
  }

  // Obtener chats de un visitante
  getVisitorChats(
    visitorId: string,
    cursor?: string,
    limit = 20
  ): Observable<GetChatsResponse> {
    let params = new HttpParams().set('limit', limit.toString());
    
    if (cursor) {
      params = params.set('cursor', cursor);
    }

    // Configurar headers de autenticación
    const token = this.getAccessToken();
    const options = token ? 
      { params, headers: { 'Authorization': `Bearer ${token}` }, withCredentials: true } : 
      { params, withCredentials: true };

    return this.http.get<GetChatsResponse>(
      `${this.baseUrl}/v2/chats/visitor/${visitorId}`,
      options
    );
  }

  // Crear chat con visitante (funcionalidad proactiva)
  createChatWithVisitor(
    request: CreateChatWithVisitorRequest
  ): Observable<CreateChatWithVisitorResponse> {
    if (request.firstMessage) {
      // Usar endpoint que crea chat con mensaje inicial
      return this.http.post<CreateChatWithVisitorResponse>(
        `${this.baseUrl}/v2/chats/with-message`,
        {
          firstMessage: request.firstMessage,
          visitorInfo: request.visitorInfo,
          metadata: request.metadata
        },
        { withCredentials: true }
      );
    } else {
      // Usar endpoint que solo crea el chat
      return this.http.post<CreateChatWithVisitorResponse>(
        `${this.baseUrl}/v2/chats`,
        {
          visitorInfo: request.visitorInfo,
          metadata: request.metadata
        },
        { withCredentials: true }
      );
    }
  }

  // Obtener cola de chats pendientes (sin asignar)
  getPendingChats(department?: string, limit = 50): Observable<{
    queue: Chat[];
    total: number;
    waitTime: { average: number; median: number };
  }> {
    let params = new HttpParams().set('limit', limit.toString());
    
    if (department) {
      params = params.set('department', department);
    }

    return this.http.get<{
      queue: Chat[];
      total: number;
      waitTime: { average: number; median: number };
    }>(`${this.baseUrl}/v2/chats/queue/pending`, { params, withCredentials: true });
  }

  // Asignar chat a comercial
  assignChatToCommercial(
    chatId: string,
    commercialId: string
  ): Observable<{ success: boolean; assignedAt: string }> {
    return this.http.put<{ success: boolean; assignedAt: string }>(
      `${this.baseUrl}/v2/chats/${chatId}/assign/${commercialId}`,
      {},
      { withCredentials: true }
    );
  }

  // Identificar visitante (para tracking)
  identifyVisitor(request: IdentifyVisitorRequest): Observable<IdentifyVisitorResponse> {
    return this.http.post<IdentifyVisitorResponse>(
      `${this.baseUrl}/visitors/identify`,
      request,
      { withCredentials: true }
    );
  }

  // Mantener sesión activa (heartbeat)
  sendHeartbeat(request: HeartbeatRequest): Observable<HeartbeatResponse> {
    return this.http.post<HeartbeatResponse>(
      `${this.baseUrl}/visitors/session/heartbeat`,
      request,
      { withCredentials: true }
    );
  }

  // Terminar sesión de visitante
  endSession(request: EndSessionRequest): Observable<EndSessionResponse> {
    return this.http.post<EndSessionResponse>(
      `${this.baseUrl}/visitors/session/end`,
      request,
      { withCredentials: true }
    );
  }

  // Obtener intenciones del visitante
  getVisitorIntents(visitorId: string): Observable<{
    visitorId: string;
    intents: Array<{
      category: string;
      confidence: number;
      description?: string;
    }>;
    summary: {
      totalIntents: number;
      highestConfidence: number;
      dominantCategory: string;
    };
  }> {
    return this.http.get<{
      visitorId: string;
      intents: Array<{
        category: string;
        confidence: number;
        description?: string;
      }>;
      summary: {
        totalIntents: number;
        highestConfidence: number;
        dominantCategory: string;
      };
    }>(`${this.baseUrl}/tracking/intent/${visitorId}`, { withCredentials: true });
  }

  // Obtener tags de intención del visitante
  getVisitorIntentTags(visitorId: string): Observable<{
    tags: Array<{
      name: string;
      category: string;
      confidence: number;
    }>;
    categories: Record<string, number>;
    visitor: Visitor;
  }> {
    return this.http.get<{
      tags: Array<{
        name: string;
        category: string;
        confidence: number;
      }>;
      categories: Record<string, number>;
      visitor: Visitor;
    }>(`${this.baseUrl}/tracking/intent-tags/${visitorId}`, { withCredentials: true });
  }

  // Obtener estadísticas de visitantes usando tenant-visitors endpoint
  getVisitorStats(tenantId: string): Observable<VisitorStats> {
    return this.http.get<VisitorStats>(`${this.baseUrl}/tenant-visitors/${tenantId}/visitors/stats`, { withCredentials: true });
  }

  // Obtener información de la empresa del usuario autenticado
  getCompanySites(): Observable<{
    sites: Array<{
      siteId: string;
      tenantId: string;
      siteName: string;
      domain: string;
      isActive: boolean;
    }>;
    companyId: string;
    companyName: string;
    totalSites: number;
  }> {
    console.log('[VisitorsDataService] Obteniendo información de la empresa del usuario autenticado');
    
    // Usar el endpoint /api/me/company que requiere autenticación (cookies BFF)
    return this.http.get<{
      id: string;
      companyName: string;
      domains: string[];
    }>(`${this.baseUrl}/me/company`, { 
      withCredentials: true // Requiere autenticación via cookies BFF
    }).pipe(
      switchMap(companyInfo => {
        console.log('[VisitorsDataService] Información de empresa obtenida:', companyInfo);
        
        // Transformar la respuesta de /me/company al formato esperado
        // El companyId ES el siteId válido que espera el backend
        const sites = companyInfo.domains.map(domain => ({
          siteId: companyInfo.id, // Usar directamente el company id como siteId (es un UUID válido)
          tenantId: companyInfo.id, // Usar el company id como tenant id
          siteName: domain,
          domain: domain,
          isActive: true // Asumir que todos los dominios están activos
        }));

        return new Observable<{
          sites: Array<{
            siteId: string;
            tenantId: string;
            siteName: string;
            domain: string;
            isActive: boolean;
          }>;
          companyId: string;
          companyName: string;
          totalSites: number;
        }>(subscriber => {
          subscriber.next({
            sites: sites,
            companyId: companyInfo.id,
            companyName: companyInfo.companyName,
            totalSites: sites.length
          });
          subscriber.complete();
        });
      }),
      tap(response => {
        console.log('[VisitorsDataService] Sitios procesados:', response);
      }),
      catchError(error => {
        console.error('[VisitorsDataService] Error al obtener información de la empresa:', error);
        return throwError(() => error);
      })
    );
  }



  /**
   * @deprecated Usar getCompanySites() directamente en su lugar
   * Método simple para obtener sitios - mantenido para compatibilidad
   */
  getUserSites(): Observable<Array<{
    siteId: string;
    tenantId: string;
    siteName: string;
    domain: string;
    isActive: boolean;
  }>> {
    console.warn('[VisitorsDataService] getUserSites() está deprecado, usar getCompanySites() directamente');
    
    // Usar el método completo y extraer solo los sitios
    return this.getCompanySites().pipe(
      switchMap(response => {
        return new Observable<Array<{
          siteId: string;
          tenantId: string;
          siteName: string;
          domain: string;
          isActive: boolean;
        }>>(subscriber => {
          subscriber.next(response.sites);
          subscriber.complete();
        });
      })
    );
  }

  /**
   * Método fallback para obtener sitios cuando el endpoint principal no está disponible
   */
  private getCompanySitesFallback(): Observable<{
    sites: Array<{
      siteId: string;
      tenantId: string;
      siteName: string;
      domain: string;
      isActive: boolean;
    }>;
    companyId: string;
    companyName: string;
    totalSites: number;
  }> {
    return this.sessionService.ensureSession$().pipe(
      switchMap(user => {
        console.log('[VisitorsDataService] Usuario obtenido para fallback:', user);
        
        // Usar directamente el endpoint /api/me/company que requiere autenticación
        console.log('[VisitorsDataService] Fallback: Usando endpoint /api/me/company');
        return this.getCompanySites();
      }),
      catchError(error => {
        console.error('[VisitorsDataService] Error en fallback:', error);
        
        // Como último recurso, intentar obtener todos los sitios del usuario
        console.log('[VisitorsDataService] Último recurso: obteniendo sitios del usuario');
        return this.http.get<{
          sites: Array<{
            siteId: string;
            tenantId: string;
            siteName: string;
            domain: string;
            isActive: boolean;
          }>;
          companyId: string;
          companyName: string;
          totalSites: number;
        }>(`${this.baseUrl}/sites/user`, { 
          withCredentials: true 
        });
      })
    );
  }

  // Obtener sitio específico por ID (para compatibilidad)
  getSiteById(siteId: string): Observable<{
    siteId: string;
    tenantId: string;
    siteName: string;
    companyName: string;
    domain: string;
    isActive: boolean;
  }> {
    console.log(`[VisitorsDataService] Obteniendo sitio por ID: ${siteId}`);
    
    return this.http.get<{
      siteId: string;
      tenantId: string;
      siteName: string;
      companyName: string;
      domain: string;
      isActive: boolean;
    }>(`${this.baseUrl}/sites/${siteId}`, { 
      withCredentials: true 
    }).pipe(
      tap(response => console.log('[VisitorsDataService] Sitio obtenido:', response)),
      catchError(error => {
        console.error('[VisitorsDataService] Error al obtener sitio:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * @deprecated Usar getCompanySites() o getSiteById() en su lugar
   * Método legacy mantenido para compatibilidad temporal
   */
  resolveSite(host: string): Observable<{
    siteId: string;
    tenantId: string;
    siteName: string;
    companyName: string;
  }> {
    console.warn('[VisitorsDataService] resolveSite() está deprecado, usar getCompanySites() en su lugar');
    
    // Buscar en los sitios de la empresa el que coincida con el host
    return this.getCompanySites().pipe(
      switchMap(response => {
        const hostname = (host || '').split(':')[0].trim().toLowerCase();
        const matchingSite = response.sites.find(site => 
          site.domain.toLowerCase() === hostname || 
          site.domain.toLowerCase().includes(hostname)
        );

        if (matchingSite) {
          return new Observable<{
            siteId: string;
            tenantId: string;
            siteName: string;
            companyName: string;
          }>(subscriber => {
            subscriber.next({
              siteId: matchingSite.siteId,
              tenantId: matchingSite.tenantId,
              siteName: matchingSite.siteName,
              companyName: response.companyName
            });
            subscriber.complete();
          });
        } else {
          return throwError(() => new Error(`No se encontró sitio para el host: ${hostname}`));
        }
      })
    );
  }
}
