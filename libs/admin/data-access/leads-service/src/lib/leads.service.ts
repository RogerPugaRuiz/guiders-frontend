import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, of, tap } from 'rxjs';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import {
  CrmCompanyConfig,
  CrmSyncRecord,
  CreateCrmConfigRequest,
  TestConnectionResponse,
  CrmType,
} from '@guiders-frontend/shared/types';

@Injectable({
  providedIn: 'root',
})
export class LeadsService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly baseUrl = `${this.environment.api.baseUrl}/v1/leads/admin`;

  // BehaviorSubjects para estado reactivo
  private readonly configSubject = new BehaviorSubject<CrmCompanyConfig | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly savingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  private readonly syncRecordsSubject = new BehaviorSubject<CrmSyncRecord[]>([]);
  private readonly supportedCrmTypesSubject = new BehaviorSubject<CrmType[]>([]);

  // Observables publicos
  readonly config$ = this.configSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly saving$ = this.savingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();
  readonly syncRecords$ = this.syncRecordsSubject.asObservable();
  readonly supportedCrmTypes$ = this.supportedCrmTypesSubject.asObservable();

  private getHttpOptions(): { headers: HttpHeaders; withCredentials: boolean } {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const token = localStorage.getItem('access-token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return {
      headers,
      withCredentials: true,
    };
  }

  /**
   * Obtener tipos de CRM soportados
   * GET /api/v1/leads/admin/supported-crms
   */
  getSupportedCrmTypes(): Observable<CrmType[]> {
    return this.http
      .get<CrmType[]>(`${this.baseUrl}/supported-crms`, this.getHttpOptions())
      .pipe(
        tap((types) => this.supportedCrmTypesSubject.next(types)),
        catchError((error) => {
          console.error('Error al obtener tipos de CRM:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtener configuracion de CRM para la empresa
   * GET /api/v1/leads/admin/config
   */
  getConfig(): Observable<CrmCompanyConfig | null> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<CrmCompanyConfig>(`${this.baseUrl}/config`, this.getHttpOptions()).pipe(
      tap((config) => {
        this.configSubject.next(config);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('Error al obtener configuracion CRM:', error);

        // Si no existe configuracion, devolver null
        if (error.status === 404) {
          this.configSubject.next(null);
          this.loadingSubject.next(false);
          return of(null);
        }

        this.errorSubject.next('Error al cargar la configuracion de CRM');
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Crear o actualizar configuracion de CRM
   * POST /api/v1/leads/admin/config
   */
  saveConfig(request: CreateCrmConfigRequest): Observable<CrmCompanyConfig> {
    this.savingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .post<CrmCompanyConfig>(`${this.baseUrl}/config`, request, this.getHttpOptions())
      .pipe(
        tap((config) => {
          this.configSubject.next(config);
          this.savingSubject.next(false);
        }),
        catchError((error) => {
          console.error('Error al guardar configuracion CRM:', error);
          this.errorSubject.next('Error al guardar la configuracion');
          this.savingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Probar conexion con el CRM
   * POST /api/v1/leads/admin/config/:configId/test
   */
  testConnection(configId: string): Observable<TestConnectionResponse> {
    this.savingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .post<TestConnectionResponse>(`${this.baseUrl}/config/${configId}/test`, {}, this.getHttpOptions())
      .pipe(
        tap(() => {
          this.savingSubject.next(false);
        }),
        catchError((error) => {
          console.error('Error al probar conexion CRM:', error);
          this.errorSubject.next('Error al probar la conexion');
          this.savingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Eliminar configuracion de CRM
   * DELETE /api/v1/leads/admin/config/:configId
   */
  deleteConfig(configId: string): Observable<void> {
    this.savingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.delete<void>(`${this.baseUrl}/config/${configId}`, this.getHttpOptions()).pipe(
      tap(() => {
        this.configSubject.next(null);
        this.savingSubject.next(false);
      }),
      catchError((error) => {
        console.error('Error al eliminar configuracion CRM:', error);
        this.errorSubject.next('Error al eliminar la configuracion');
        this.savingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Obtener registros de sincronizacion
   * GET /api/v1/leads/admin/sync-records
   */
  getSyncRecords(onlyFailed: boolean = false): Observable<CrmSyncRecord[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const endpoint = onlyFailed ? `${this.baseUrl}/sync-records/failed` : `${this.baseUrl}/sync-records`;

    return this.http.get<CrmSyncRecord[]>(endpoint, this.getHttpOptions()).pipe(
      tap((records) => {
        this.syncRecordsSubject.next(records);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('Error al obtener registros de sincronizacion:', error);
        this.errorSubject.next('Error al cargar los registros de sincronizacion');
        this.loadingSubject.next(false);
        return of([]);
      })
    );
  }

  /**
   * Obtener configuracion actual del cache
   */
  getCurrentConfig(): CrmCompanyConfig | null {
    return this.configSubject.value;
  }

  /**
   * Obtener registros actuales del cache
   */
  getCurrentSyncRecords(): CrmSyncRecord[] {
    return this.syncRecordsSubject.value;
  }

  /**
   * Limpiar estado
   */
  clearState(): void {
    this.configSubject.next(null);
    this.syncRecordsSubject.next([]);
    this.errorSubject.next(null);
    this.loadingSubject.next(false);
    this.savingSubject.next(false);
  }
}
