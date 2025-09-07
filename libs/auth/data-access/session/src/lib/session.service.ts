import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  name: string;
  // Añade más propiedades según tu modelo de usuario
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private me$?: Observable<User | null>;

  ensureSession$(): Observable<User> {
    if (!this.me$) {
      this.me$ = this.http.get<User>('/api/bff/auth/me', { withCredentials: true })
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    return this.me$ as Observable<User>;
  }

  clearCache(): void {
    this.me$ = undefined;
  }
}
