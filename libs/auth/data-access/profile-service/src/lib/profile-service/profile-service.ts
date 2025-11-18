import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ENVIRONMENT_TOKEN, UserProfile } from '@guiders-frontend/auth/data-access/session';

export interface UploadAvatarResponse {
  avatarUrl: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT_TOKEN);
  private readonly baseUrl = `${this.environment.api.baseUrl}`;

  /**
   * Obtiene el token de acceso desde localStorage
   */
  private getAccessToken(): string | null {
    return localStorage.getItem('access-token');
  }

  /**
   * Sube o actualiza el avatar del usuario
   * @param userId ID del usuario
   * @param file Archivo de imagen (PNG o JPG, máx 5MB)
   * @returns Observable con la URL del avatar actualizado y mensaje de confirmación
   */
  uploadAvatar(userId: string, file: File): Observable<UploadAvatarResponse> {
    // Validar tipo de archivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return throwError(() => new Error('Formato de archivo no válido. Solo se permiten PNG y JPG.'));
    }

    // Validar tamaño de archivo (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return throwError(() => new Error('El archivo es demasiado grande. Tamaño máximo: 5MB.'));
    }

    // Crear FormData para envío multipart/form-data
    const formData = new FormData();
    formData.append('file', file);

    console.log(`[ProfileService] Uploading avatar for user ${userId}`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Configurar headers de autenticación
    const token = this.getAccessToken();
    const options = token ?
      { headers: { 'Authorization': `Bearer ${token}` }, withCredentials: true } :
      { withCredentials: true };

    // Realizar petición POST con FormData
    return this.http.post<UploadAvatarResponse>(
      `${this.baseUrl}/user/auth/${userId}/avatar`,
      formData,
      options
    ).pipe(
      tap(response => {
        console.log('[ProfileService] Avatar uploaded successfully:', response);
      }),
      catchError(error => {
        console.error('[ProfileService] Error uploading avatar:', error);

        // Mapear errores HTTP a mensajes descriptivos
        let errorMessage = 'Error al subir el avatar. Inténtalo de nuevo.';

        if (error.status === 400) {
          errorMessage = error.error?.message || 'Archivo inválido.';
        } else if (error.status === 401) {
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para actualizar este avatar.';
        } else if (error.status === 404) {
          errorMessage = 'Usuario no encontrado.';
        } else if (error.status === 413) {
          errorMessage = 'El archivo es demasiado grande.';
        } else if (error.status === 500) {
          errorMessage = 'Error del servidor. Inténtalo más tarde.';
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Obtiene el perfil completo del usuario autenticado
   * @returns Observable con el perfil completo incluyendo avatarUrl y keycloakId
   */
  getUserProfile(): Observable<UserProfile> {
    console.log('[ProfileService] Fetching user profile from /api/user/auth/me');

    // Configurar headers de autenticación
    const token = this.getAccessToken();
    const options = token ?
      { headers: { 'Authorization': `Bearer ${token}` }, withCredentials: true } :
      { withCredentials: true };

    return this.http.get<UserProfile>(
      `${this.baseUrl}/user/auth/me`,
      options
    ).pipe(
      tap(profile => {
        console.log('[ProfileService] User profile loaded:', {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          hasAvatar: !!profile.avatarUrl
        });
      }),
      catchError(error => {
        console.error('[ProfileService] Error fetching user profile:', error);

        let errorMessage = 'Error al obtener el perfil del usuario.';

        if (error.status === 401) {
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 404) {
          errorMessage = 'Perfil de usuario no encontrado.';
        } else if (error.status === 500) {
          errorMessage = 'Error del servidor. Inténtalo más tarde.';
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
