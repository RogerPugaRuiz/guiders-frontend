import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SaveContactDataRequest,
  LeadContactData,
} from '@guiders-frontend/shared/types';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';

@Injectable({ providedIn: 'root' })
export class LeadContactService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);

  private get baseUrl(): string {
    return `${this.environment.api.baseUrl}/leads`;
  }

  /**
   * Guarda o actualiza los datos de contacto de un visitante
   * @param visitorId ID del visitante
   * @param data Datos de contacto a guardar
   * @returns Observable con los datos guardados
   */
  saveContactData(
    visitorId: string,
    data: SaveContactDataRequest
  ): Observable<LeadContactData> {
    return this.http.post<LeadContactData>(
      `${this.baseUrl}/contact-data/${visitorId}`,
      data,
      { withCredentials: true }
    );
  }

  /**
   * Obtiene los datos de contacto de un visitante
   * @param visitorId ID del visitante
   * @returns Observable con los datos de contacto o null
   */
  getContactData(visitorId: string): Observable<LeadContactData | null> {
    return this.http.get<LeadContactData | null>(
      `${this.baseUrl}/contact-data/${visitorId}`,
      { withCredentials: true }
    );
  }
}
