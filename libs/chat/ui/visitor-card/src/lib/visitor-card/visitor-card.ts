/**
 * Visitor Card Component
 * Basado en la guía de diseño B2B Web Desktop
 * Cumple WCAG 2.2 AA
 */

import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from '@guiders-frontend/button';
import { Visitor, CreateChatWithVisitorRequest } from '@guiders-frontend/shared/types';
import { LeadScore } from '@guiders-frontend/visitors-data-service';

export type VisitorCardSize = 'compact' | 'default' | 'detailed';

@Component({
  selector: 'lib-visitor-card',
  imports: [CommonModule, Button],
  templateUrl: './visitor-card.html',
  styleUrl: './visitor-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitorCard {
  // === INPUTS ===
  readonly visitor = input.required<Visitor>();
  readonly size = input<VisitorCardSize>('default');
  readonly showActions = input<boolean>(true);
  readonly selected = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly selectable = input<boolean>(false);
  readonly leadScore = input<LeadScore | null>(null);

  // === OUTPUTS ===
  readonly visitorClick = output<Visitor>();
  readonly visitorSelect = output<{ visitor: Visitor; selected: boolean }>();
  readonly createChat = output<CreateChatWithVisitorRequest>();
  readonly viewDetails = output<Visitor>();

  // === COMPUTED VALUES ===
  readonly statusIcon = computed(() => {
    const status = this.visitor().status;
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '⚫';
      case 'idle': return '🟡';
      default: return '⚫';
    }
  });

  readonly statusColor = computed(() => {
    const status = this.visitor().status;
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'neutral';
      case 'idle': return 'warning';
      default: return 'neutral';
    }
  });

  readonly lifecycleIcon = computed(() => {
    const lifecycle = this.visitor().lifecycle;
    switch (lifecycle) {
      case 'ANON': return '👤';
      case 'ENGAGED': return '👀';
      case 'LEAD': return '📧';
      case 'CONVERTED': return '✅';
      default: return '👤';
    }
  });

  readonly lifecycleLabel = computed(() => {
    const lifecycle = this.visitor().lifecycle;
    switch (lifecycle) {
      case 'ANON': return 'Anónimo';
      case 'ENGAGED': return 'Interesado';
      case 'LEAD': return 'Lead';
      case 'CONVERTED': return 'Convertido';
      default: return 'Anónimo';
    }
  });

  readonly lastVisitFormatted = computed(() => {
    const date = this.visitor().lastVisit;
    return this.formatRelativeTime(new Date(date));
  });

  readonly visitorInitials = computed(() => {
    const name = this.visitor().name;
    if (!name) return '?';
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  });

  readonly cssClasses = computed(() => {
    return {
      'guiders-visitor-card': true,
      [`guiders-visitor-card--${this.size()}`]: true,
      'guiders-visitor-card--selected': this.selected(),
      'guiders-visitor-card--disabled': this.disabled(),
      'guiders-visitor-card--selectable': this.selectable(),
      'guiders-visitor-card--has-active-chat': this.visitor().hasActiveChat,
      'guiders-visitor-card--new-visitor': this.visitor().isNewVisitor,
    };
  });

  readonly tierIcon = computed(() => {
    const tier = this.leadScore()?.tier;
    switch (tier) {
      case 'hot': return '🔴';
      case 'warm': return '🟡';
      case 'cold': return '🔵';
      default: return null;
    }
  });

  // === EVENT HANDLERS ===
  onCardClick(event: Event): void {
    if (this.disabled()) return;
    
    // Si es seleccionable y se hace click en el checkbox, no emitir click
    const target = event.target as HTMLElement;
    if (this.selectable() && target.closest('.guiders-visitor-card__checkbox')) {
      return;
    }

    this.visitorClick.emit(this.visitor());
  }

  onCheckboxChange(event: Event): void {
    if (this.disabled()) return;
    
    event.stopPropagation();
    const checked = (event.target as HTMLInputElement).checked;
    this.visitorSelect.emit({ visitor: this.visitor(), selected: checked });
  }

  onCreateChat(event: Event): void {
    if (this.disabled()) return;
    
    event.stopPropagation();
    
    const visitor = this.visitor();
    const request: CreateChatWithVisitorRequest = {
      visitorId: visitor.id,
      visitorInfo: {
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone
      },
      metadata: {
        source: 'visitor_card',
        priority: 'MEDIUM'
      }
    };
    
    this.createChat.emit(request);
  }

  onViewDetails(event: Event): void {
    event.stopPropagation();
    this.viewDetails.emit(this.visitor());
  }

  async onCopyUrl(event: Event): Promise<void> {
    event.stopPropagation();
    const url = this.visitor().currentUrl;
    if (url) {
      await navigator.clipboard.writeText(url);
    }
  }

  // === PRIVATE METHODS ===
  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString();
  }
}
