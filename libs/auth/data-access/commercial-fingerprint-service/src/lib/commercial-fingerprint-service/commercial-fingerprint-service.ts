import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';

export interface RegisterFingerprintRequest {
  commercialId: string;
  fingerprint: string;
}

export interface RegisterFingerprintResponse {
  success: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class CommercialFingerprintService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  /**
   * Registra el fingerprint de un comercial para que no aparezca como visitante
   */
  registerFingerprint(
    commercialId: string,
    fingerprint: string
  ): Observable<RegisterFingerprintResponse> {
    const token = this.getAccessToken();
    const url = `${this.environment.api.baseUrl}/v2/commercials/register-fingerprint`;

    return this.http.post<RegisterFingerprintResponse>(
      url,
      { commercialId, fingerprint },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      }
    );
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access-token');
  }
}
