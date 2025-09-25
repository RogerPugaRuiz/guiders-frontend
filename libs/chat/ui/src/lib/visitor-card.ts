import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Visitor } from '@guiders-frontend/shared/types';

@Component({
  selector: 'lib-visitor-card',
  imports: [CommonModule],
  templateUrl: './visitor-card.html',
  styleUrl: './visitor-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitorCard {
  readonly visitor = input.required<Visitor>();
  readonly showActions = input<boolean>(true);
  readonly selectable = input<boolean>(false);
  readonly selected = input<boolean>(false);

  readonly startChat = output<Visitor>();
  readonly viewDetails = output<Visitor>();
  readonly selectionChange = output<boolean>();

  readonly visitorStatus = computed(() => {
    const visitor = this.visitor();
    if (visitor.status === 'offline') return 'offline';
    if (visitor.currentUrl) return 'browsing';
    return visitor.status;
  });

  readonly statusText = computed(() => {
    const status = this.visitorStatus();
    switch (status) {
      case 'offline': return 'Desconectado';
      case 'browsing': return 'Navegando';
      case 'online': return 'En línea';
      default: return 'Desconocido';
    }
  });

  readonly timeOnSite = computed(() => {
    const visitor = this.visitor();
    if (!visitor.currentSessionStart) return '0m';
    
    const started = new Date(visitor.currentSessionStart);
    const now = new Date();
    const diffMs = now.getTime() - started.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m`;
  });

  readonly avatarText = computed(() => {
    const visitor = this.visitor();
    const name = visitor.name || visitor.email || 'Visitante';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });

  readonly currentPageText = computed(() => {
    const url = this.visitor().currentUrl;
    if (!url) return '';
    return url.length > 40 ? `${url.slice(0, 40)}...` : url;
  });

  readonly referrerText = computed(() => {
    const referrer = this.visitor().referrer;
    if (!referrer) return '';
    return referrer.length > 30 ? `${referrer.slice(0, 30)}...` : referrer;
  });

  onStartChatClick(event: Event): void {
    event.stopPropagation();
    this.startChat.emit(this.visitor());
  }

  onViewDetailsClick(event: Event): void {
    event.stopPropagation();
    this.viewDetails.emit(this.visitor());
  }

  onCardClick(): void {
    if (this.selectable()) {
      this.selectionChange.emit(!this.selected());
    } else {
      this.viewDetails.emit(this.visitor());
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCardClick();
    }
  }

  onCheckboxChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.selectionChange.emit(checkbox.checked);
  }
}
