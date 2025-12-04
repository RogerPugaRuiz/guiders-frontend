import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of, tap } from 'rxjs';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import {
  LlmConfig,
  CreateLlmConfigRequest,
  UpdateLlmConfigRequest,
  LlmProvidersResponse,
  LLM_CONFIG_DEFAULTS
} from './llm-config.interface';

interface ApiLlmConfigResponse {
  siteId: string;
  companyId: string;
  aiAutoResponseEnabled: boolean;
  aiSuggestionsEnabled: boolean;
  aiRespondWithCommercial: boolean;
  preferredProvider: string;
  preferredModel: string;
  customSystemPrompt?: string;
  maxResponseTokens: number;
  temperature: number;
  responseDelayMs: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LlmConfigService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly baseUrl = `${this.environment.api.baseUrl}/v2/llm/config`;

  private readonly configSubject = new BehaviorSubject<LlmConfig | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly savingSubject = new BehaviorSubject<boolean>(false);

  readonly config$ = this.configSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  readonly saving$ = this.savingSubject.asObservable();

  private getHttpOptions(): { headers: HttpHeaders; withCredentials: boolean } {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const token = localStorage.getItem('access-token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return {
      headers,
      withCredentials: true
    };
  }

  /**
   * Obtener configuracion de IA para un sitio
   */
  getConfig(siteId: string): Observable<LlmConfig> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<ApiLlmConfigResponse>(
      `${this.baseUrl}/${siteId}`,
      this.getHttpOptions()
    ).pipe(
      map(response => this.transformFromApi(response)),
      tap(config => {
        this.configSubject.next(config);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al obtener configuracion LLM:', error);

        // Si no existe configuracion, devolver valores por defecto
        if (error.status === 404) {
          const defaultConfig: LlmConfig = {
            siteId,
            companyId: '',
            ...LLM_CONFIG_DEFAULTS
          };
          this.configSubject.next(defaultConfig);
          this.loadingSubject.next(false);
          return of(defaultConfig);
        }

        this.errorSubject.next('Error al cargar la configuracion');
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Crear nueva configuracion de IA
   */
  createConfig(request: CreateLlmConfigRequest): Observable<LlmConfig> {
    this.savingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.post<ApiLlmConfigResponse>(
      this.baseUrl,
      request,
      this.getHttpOptions()
    ).pipe(
      map(response => this.transformFromApi(response)),
      tap(config => {
        this.configSubject.next(config);
        this.savingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al crear configuracion LLM:', error);
        this.errorSubject.next('Error al crear la configuracion');
        this.savingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Actualizar configuracion de IA
   */
  updateConfig(siteId: string, updates: UpdateLlmConfigRequest): Observable<LlmConfig> {
    this.savingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.patch<ApiLlmConfigResponse>(
      `${this.baseUrl}/${siteId}`,
      updates,
      this.getHttpOptions()
    ).pipe(
      map(response => this.transformFromApi(response)),
      tap(config => {
        this.configSubject.next(config);
        this.savingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al actualizar configuracion LLM:', error);
        this.errorSubject.next('Error al guardar los cambios');
        this.savingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Eliminar configuracion (vuelve a valores por defecto)
   */
  deleteConfig(siteId: string): Observable<void> {
    this.savingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.delete<void>(
      `${this.baseUrl}/${siteId}`,
      this.getHttpOptions()
    ).pipe(
      tap(() => {
        // Resetear a valores por defecto
        const defaultConfig: LlmConfig = {
          siteId,
          companyId: this.configSubject.value?.companyId || '',
          ...LLM_CONFIG_DEFAULTS
        };
        this.configSubject.next(defaultConfig);
        this.savingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al eliminar configuracion LLM:', error);
        this.errorSubject.next('Error al restablecer la configuracion');
        this.savingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Obtener lista de proveedores LLM con sus modelos
   */
  getProviders(): Observable<LlmProvidersResponse> {
    return this.http.get<LlmProvidersResponse>(
      `${this.baseUrl}/providers`,
      this.getHttpOptions()
    ).pipe(
      catchError(error => {
        console.error('Error al obtener proveedores LLM:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener configuracion actual del cache
   */
  getCurrentConfig(): LlmConfig | null {
    return this.configSubject.value;
  }

  /**
   * Limpiar estado
   */
  clearState(): void {
    this.configSubject.next(null);
    this.errorSubject.next(null);
    this.loadingSubject.next(false);
    this.savingSubject.next(false);
  }

  private transformFromApi(response: ApiLlmConfigResponse): LlmConfig {
    return {
      siteId: response.siteId,
      companyId: response.companyId,
      aiAutoResponseEnabled: response.aiAutoResponseEnabled,
      aiSuggestionsEnabled: response.aiSuggestionsEnabled,
      aiRespondWithCommercial: response.aiRespondWithCommercial,
      preferredProvider: response.preferredProvider,
      preferredModel: response.preferredModel,
      customSystemPrompt: response.customSystemPrompt,
      maxResponseTokens: response.maxResponseTokens,
      temperature: response.temperature,
      responseDelayMs: response.responseDelayMs,
      createdAt: response.createdAt ? new Date(response.createdAt) : undefined,
      updatedAt: response.updatedAt ? new Date(response.updatedAt) : undefined
    };
  }
}
