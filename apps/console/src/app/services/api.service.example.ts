// Ejemplo de cómo usar las variables de environment en un servicio
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.api.baseUrl;

  constructor() {
    console.log('API Base URL:', this.baseUrl);
    console.log('Is Production:', environment.production);
  }

  getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }
}
