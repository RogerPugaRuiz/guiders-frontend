import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import {
  Visitor,
  VisitorFilters,
  VisitorPagination,
  GetVisitorsResponse,
  GetVisitorResponse,
  GetVisitorSessionsResponse,
  CreateChatWithVisitorRequest,
  CreateChatWithVisitorResponse,
  IdentifyVisitorRequest,
  IdentifyVisitorResponse,
  EndSessionRequest,
  EndSessionResponse,
  VisitorStats,
  Chat,
  GetChatsResponse
} from '@guiders-frontend/shared/types';

@Injectable({
  providedIn: 'root'
})
export class VisitorsDataService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly baseUrl = `${this.environment.api.baseUrl}`;

  // Obtener visitantes con filtros y paginación
  getVisitors(
    siteId: string,
    filters?: VisitorFilters,
    pagination?: VisitorPagination,
    // TODO: Implement sort functionality
    // sort?: VisitorSort
  ): Observable<GetVisitorsResponse> {
    let params = new HttpParams();
    
    if (filters?.includeOffline !== undefined) {
      params = params.set('includeOffline', filters.includeOffline.toString());
    }
    
    if (pagination?.limit) {
      params = params.set('limit', pagination.limit.toString());
    }
    
    if (pagination?.offset) {
      params = params.set('offset', pagination.offset.toString());
    }

    return this.http.get<GetVisitorsResponse>(
      `${this.baseUrl}/site-visitors/${siteId}/visitors`,
      { params }
    );
  }

  // Obtener visitante por ID
  getVisitorById(visitorId: string): Observable<GetVisitorResponse> {
    return this.http.get<GetVisitorResponse>(
      `${this.baseUrl}/visitors/${visitorId}`
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
      { params }
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

    return this.http.get<GetChatsResponse>(
      `${this.baseUrl}/v2/chats/visitor/${visitorId}`,
      { params }
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
        }
      );
    } else {
      // Usar endpoint que solo crea el chat
      return this.http.post<CreateChatWithVisitorResponse>(
        `${this.baseUrl}/v2/chats`,
        {
          visitorInfo: request.visitorInfo,
          metadata: request.metadata
        }
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
    }>(`${this.baseUrl}/v2/chats/queue/pending`, { params });
  }

  // Asignar chat a comercial
  assignChatToCommercial(
    chatId: string,
    commercialId: string
  ): Observable<{ success: boolean; assignedAt: string }> {
    return this.http.put<{ success: boolean; assignedAt: string }>(
      `${this.baseUrl}/v2/chats/${chatId}/assign/${commercialId}`,
      {}
    );
  }

  // Identificar visitante (para tracking)
  identifyVisitor(request: IdentifyVisitorRequest): Observable<IdentifyVisitorResponse> {
    return this.http.post<IdentifyVisitorResponse>(
      `${this.baseUrl}/visitors/identify`,
      request
    );
  }

  // Terminar sesión de visitante
  endSession(request: EndSessionRequest): Observable<EndSessionResponse> {
    return this.http.post<EndSessionResponse>(
      `${this.baseUrl}/visitors/session/end`,
      request
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
    }>(`${this.baseUrl}/tracking/intent/${visitorId}`);
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
    }>(`${this.baseUrl}/tracking/intent-tags/${visitorId}`);
  }

  // Obtener estadísticas de visitantes
  getVisitorStats(siteId?: string): Observable<VisitorStats> {
    // Esta sería una implementación personalizada ya que no está en la API actual
    // Se podría combinar varias llamadas a la API para generar estadísticas
    let params = new HttpParams();
    if (siteId) {
      params = params.set('siteId', siteId);
    }

    return this.http.get<VisitorStats>(
      `${this.baseUrl}/visitors/stats`,
      { params }
    );
  }

  // Resolver sitio por host
  resolveSite(host: string): Observable<{
    siteId: string;
    tenantId: string;
    siteName: string;
    companyName: string;
  }> {
    return this.http.post<{
      siteId: string;
      tenantId: string;
      siteName: string;
      companyName: string;
    }>(`${this.baseUrl}/sites/resolve`, { host });
  }
}
