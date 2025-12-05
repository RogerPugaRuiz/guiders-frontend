import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of, tap, throwError } from 'rxjs';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import {
  WhiteLabelConfig,
  UpdateWhiteLabelConfigRequest,
  UploadResponse,
  UploadFontResponse,
  ApiWhiteLabelConfigResponse,
  WHITE_LABEL_DEFAULTS,
  CustomFontFile
} from './white-label.interface';

@Injectable({
  providedIn: 'root'
})
export class WhiteLabelService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly baseUrl = `${this.environment.api.baseUrl}/v2/companies`;

  private readonly configSubject = new BehaviorSubject<WhiteLabelConfig | null>(null);
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

  private getUploadHttpOptions(): { headers: HttpHeaders; withCredentials: boolean } {
    let headers = new HttpHeaders();

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
   * Obtener configuracion de marca blanca para una empresa
   */
  getConfig(companyId: string): Observable<WhiteLabelConfig> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<ApiWhiteLabelConfigResponse>(
      `${this.baseUrl}/${companyId}/white-label`,
      this.getHttpOptions()
    ).pipe(
      map(response => this.transformFromApi(response)),
      tap(config => {
        this.configSubject.next(config);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al obtener configuracion de marca blanca:', error);

        if (error.status === 404) {
          const defaultConfig: WhiteLabelConfig = {
            siteId: '',
            companyId,
            ...WHITE_LABEL_DEFAULTS
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
   * Actualizar configuracion de marca blanca
   */
  updateConfig(companyId: string, updates: UpdateWhiteLabelConfigRequest): Observable<WhiteLabelConfig> {
    this.savingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.patch<ApiWhiteLabelConfigResponse>(
      `${this.baseUrl}/${companyId}/white-label`,
      updates,
      this.getHttpOptions()
    ).pipe(
      map(response => this.transformFromApi(response)),
      tap(config => {
        this.configSubject.next(config);
        this.savingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al actualizar configuracion de marca blanca:', error);
        this.errorSubject.next('Error al guardar los cambios');
        this.savingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Eliminar configuracion (vuelve a valores por defecto)
   */
  deleteConfig(companyId: string): Observable<void> {
    this.savingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.delete<void>(
      `${this.baseUrl}/${companyId}/white-label`,
      this.getHttpOptions()
    ).pipe(
      tap(() => {
        const defaultConfig: WhiteLabelConfig = {
          siteId: this.configSubject.value?.siteId || '',
          companyId,
          ...WHITE_LABEL_DEFAULTS
        };
        this.configSubject.next(defaultConfig);
        this.savingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al eliminar configuracion de marca blanca:', error);
        this.errorSubject.next('Error al restablecer la configuracion');
        this.savingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Subir logo
   */
  uploadLogo(companyId: string, file: File): Observable<UploadResponse> {
    const validationError = this.validateImageFile(file);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(
      `${this.baseUrl}/${companyId}/white-label/logo`,
      formData,
      this.getUploadHttpOptions()
    ).pipe(
      tap(response => {
        const currentConfig = this.configSubject.value;
        if (currentConfig) {
          this.configSubject.next({
            ...currentConfig,
            branding: {
              ...currentConfig.branding,
              logoUrl: response.url
            }
          });
        }
      }),
      catchError(error => {
        console.error('Error al subir logo:', error);
        throw error;
      })
    );
  }

  /**
   * Subir favicon
   */
  uploadFavicon(companyId: string, file: File): Observable<UploadResponse> {
    const validationError = this.validateFaviconFile(file);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(
      `${this.baseUrl}/${companyId}/white-label/favicon`,
      formData,
      this.getUploadHttpOptions()
    ).pipe(
      tap(response => {
        const currentConfig = this.configSubject.value;
        if (currentConfig) {
          this.configSubject.next({
            ...currentConfig,
            branding: {
              ...currentConfig.branding,
              faviconUrl: response.url
            }
          });
        }
      }),
      catchError(error => {
        console.error('Error al subir favicon:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar logo
   */
  deleteLogo(companyId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${companyId}/white-label/logo`,
      this.getHttpOptions()
    ).pipe(
      tap(() => {
        const currentConfig = this.configSubject.value;
        if (currentConfig) {
          this.configSubject.next({
            ...currentConfig,
            branding: {
              ...currentConfig.branding,
              logoUrl: null
            }
          });
        }
      }),
      catchError(error => {
        console.error('Error al eliminar logo:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar favicon
   */
  deleteFavicon(companyId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${companyId}/white-label/favicon`,
      this.getHttpOptions()
    ).pipe(
      tap(() => {
        const currentConfig = this.configSubject.value;
        if (currentConfig) {
          this.configSubject.next({
            ...currentConfig,
            branding: {
              ...currentConfig.branding,
              faviconUrl: null
            }
          });
        }
      }),
      catchError(error => {
        console.error('Error al eliminar favicon:', error);
        throw error;
      })
    );
  }

  /**
   * Subir archivo de fuente personalizada
   */
  uploadFont(companyId: string, file: File): Observable<UploadFontResponse> {
    const validationError = this.validateFontFile(file);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadFontResponse>(
      `${this.baseUrl}/${companyId}/white-label/font`,
      formData,
      this.getUploadHttpOptions()
    ).pipe(
      catchError(error => {
        console.error('Error al subir fuente:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar archivo de fuente
   */
  deleteFont(companyId: string, fileName: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${companyId}/white-label/font/${encodeURIComponent(fileName)}`,
      this.getHttpOptions()
    ).pipe(
      catchError(error => {
        console.error('Error al eliminar fuente:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar todas las fuentes personalizadas
   */
  deleteAllFonts(companyId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${companyId}/white-label/fonts`,
      this.getHttpOptions()
    ).pipe(
      tap(() => {
        const currentConfig = this.configSubject.value;
        if (currentConfig) {
          this.configSubject.next({
            ...currentConfig,
            typography: {
              ...currentConfig.typography,
              customFontFiles: []
            }
          });
        }
      }),
      catchError(error => {
        console.error('Error al eliminar fuentes:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener configuracion actual del cache
   */
  getCurrentConfig(): WhiteLabelConfig | null {
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

  private transformFromApi(response: ApiWhiteLabelConfigResponse): WhiteLabelConfig {
    return {
      id: response.id,
      siteId: response.siteId,
      companyId: response.companyId,
      colors: response.colors,
      branding: response.branding,
      typography: response.typography,
      theme: response.theme,
      createdAt: response.createdAt ? new Date(response.createdAt) : undefined,
      updatedAt: response.updatedAt ? new Date(response.updatedAt) : undefined
    };
  }

  private validateImageFile(file: File): string | null {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return 'Formato no valido. Solo PNG, JPG o SVG.';
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return 'Archivo demasiado grande. Maximo: 2MB.';
    }

    return null;
  }

  private validateFaviconFile(file: File): string | null {
    const allowedTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!allowedTypes.includes(file.type)) {
      return 'Formato no valido. Solo PNG o ICO.';
    }

    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
      return 'Archivo demasiado grande. Maximo: 500KB.';
    }

    return null;
  }

  private validateFontFile(file: File): string | null {
    const allowedExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return 'Formato no valido. Solo TTF, OTF, WOFF o WOFF2.';
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Archivo demasiado grande. Maximo: 5MB.';
    }

    return null;
  }
}
