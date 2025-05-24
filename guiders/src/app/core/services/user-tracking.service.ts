import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Interfaces para tipar correctamente los datos
interface PageView {
  url: string;
  title: string;
  timestamp: Date;
}

interface Interaction {
  type: string;
  elementId: string;
  metadata: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserTrackingService {
  private pageViewsSource = new BehaviorSubject<PageView[]>([]);
  currentPageViews$ = this.pageViewsSource.asObservable();
  
  private interactionsSource = new BehaviorSubject<Interaction[]>([]);
  currentInteractions$ = this.interactionsSource.asObservable();
  
  private userSessionStart: Date;
  
  constructor() {
    this.userSessionStart = new Date();
  }
  
  /**
   * Registra una vista de página
   */
  trackPageView(url: string, title: string) {
    const currentViews = this.pageViewsSource.value;
    const pageView: PageView = {
      url,
      title,
      timestamp: new Date()
    };
    
    this.pageViewsSource.next([...currentViews, pageView]);
    
    // En un entorno real, enviaríamos estos datos al backend
    console.log('Page view tracked:', pageView);
  }
  
  /**
   * Registra una interacción del usuario (clic, hover, etc.)
   */
  trackInteraction(type: string, elementId: string, metadata: any = {}) {
    const currentInteractions = this.interactionsSource.value;
    const interaction: Interaction = {
      type,
      elementId,
      metadata,
      timestamp: new Date()
    };
    
    this.interactionsSource.next([...currentInteractions, interaction]);
    
    // En un entorno real, enviaríamos estos datos al backend
    console.log('Interaction tracked:', interaction);
  }
  
  /**
   * Registra el tiempo que el usuario pasa en una página
   */
  trackTimeOnPage(url: string, timeInSeconds: number) {
    // En un entorno real, enviaríamos estos datos al backend
    console.log('Time on page tracked:', { url, timeInSeconds });
  }
  
  /**
   * Obtiene el tiempo total de la sesión del usuario
   */
  getSessionDuration() {
    const now = new Date();
    return Math.round((now.getTime() - this.userSessionStart.getTime()) / 1000);
  }
  
  /**
   * Obtiene un resumen de la actividad del usuario para los agentes comerciales
   */
  getUserActivitySummary() {
    return {
      pageViews: this.pageViewsSource.value.length,
      interactions: this.interactionsSource.value.length,
      sessionDuration: this.getSessionDuration(),
      lastPage: this.pageViewsSource.value.length > 0 
        ? this.pageViewsSource.value[this.pageViewsSource.value.length - 1]
        : null,
      interactionHeatmap: this.getInteractionHeatmap()
    };
  }
  
  /**
   * Analiza las interacciones para crear un "mapa de calor" de actividad
   */
  private getInteractionHeatmap() {
    // En un entorno real, esto sería un algoritmo más complejo
    // que analizaría las áreas de la página con más interacción
    
    const interactions = this.interactionsSource.value;
    const heatmap: Record<string, number> = {};
    
    interactions.forEach(interaction => {
      if (!heatmap[interaction.elementId]) {
        heatmap[interaction.elementId] = 0;
      }
      heatmap[interaction.elementId]++;
    });
    
    return heatmap;
  }
}
