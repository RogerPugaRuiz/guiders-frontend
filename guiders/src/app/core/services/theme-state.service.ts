import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeStateService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public readonly isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor() {
    // Establecer un estado inicial predeterminado
    const prefersDarkMode = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setDarkMode(prefersDarkMode);
  }

  setDarkMode(isDarkMode: boolean): void {
    this.isDarkModeSubject.next(isDarkMode);
  }

  get isDarkMode(): boolean {
    return this.isDarkModeSubject.value;
  }
}
