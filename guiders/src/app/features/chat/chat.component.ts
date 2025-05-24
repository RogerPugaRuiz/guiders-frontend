import { Component, AfterViewInit, PLATFORM_ID, Inject, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GhSelectComponent, GhSelectOption } from '../../shared/components/gh-select/gh-select.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, GhSelectComponent, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements AfterViewInit {
  @ViewChild('trackingInfoPanel') trackingInfoPanel!: ElementRef;
  
  // Variables para manejar el estado del panel de tracking
  showTrackingPanel = false;
  
  // Opciones para el selector de filtro
  filterOptions: GhSelectOption[] = [
    { value: 'all', label: 'Todas' },
    { value: 'unassigned', label: 'Sin asignar' },
    { value: 'active', label: 'Activas' },
    { value: 'closed', label: 'Cerradas' }
  ];
  
  selectedFilterValue: string = 'all';
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private renderer: Renderer2
  ) {}
  
  ngAfterViewInit(): void {
    // Solo ejecutar en el navegador, no durante SSR
    if (isPlatformBrowser(this.platformId)) {
      this.setupTrackingPanel();
    }
  }
  
  private setupTrackingPanel(): void {
    // El acceso al DOM ya es seguro aquí porque verificamos que estamos en el navegador
  }
  
  // Métodos para manejar los eventos de click (usando Angular en lugar de manipulación directa del DOM)
  toggleTrackingInfo(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.showTrackingPanel = !this.showTrackingPanel;
    }
  }
  
  closeTrackingInfo(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.showTrackingPanel = false;
    }
  }
  
  // Método para manejar el cambio de filtro
  onFilterChange(value: string): void {
    this.selectedFilterValue = value;
    // Aquí puedes implementar la lógica para filtrar las conversaciones
    console.log('Filtro seleccionado:', value);
  }
  
  // Aquí se podrían agregar métodos para obtener datos reales de tracking
  // Por ejemplo:
  // - getCurrentPageInfo()
  // - getVisitedPages()
  // - getDeviceInfo()
  // - getVisitorLocation()
  // - getSessionDuration()
}
