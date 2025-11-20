/**
 * Visitor Detail Panel Component
 * Panel lateral con información detallada del visitante
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Visitor } from '@guiders-frontend/shared/types';
import { LeadScore } from '@guiders-frontend/visitors-data-service';

@Component({
  selector: 'guiders-visitor-detail-panel',
  imports: [CommonModule],
  templateUrl: './visitor-detail-panel.html',
  styleUrl: './visitor-detail-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitorDetailPanel {
  // === INPUTS ===
  readonly visitor = input.required<Visitor>();
  readonly isOpen = input<boolean>(true);
  readonly leadScore = input<LeadScore | null>(null);

  // === OUTPUTS ===
  readonly close = output<void>();
  readonly openUrl = output<string>();

  // === STATE ===
  readonly urlCopied = signal<boolean>(false);

  // === COMPUTED ===
  readonly visitorInitials = computed(() => {
    const name = this.visitor().name;
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  });

  readonly statusIcon = computed(() => {
    const status = this.visitor().status;
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '⚫';
      case 'idle': return '🟡';
      default: return '⚫';
    }
  });

  readonly statusLabel = computed(() => {
    const status = this.visitor().status;
    switch (status) {
      case 'online': return 'En línea';
      case 'offline': return 'Desconectado';
      case 'idle': return 'Inactivo';
      default: return 'Desconectado';
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

  readonly truncatedUrl = computed(() => {
    const url = this.visitor().currentUrl;
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    } catch {
      return url.length > 50 ? url.substring(0, 50) + '...' : url;
    }
  });

  readonly formattedSessionDuration = computed(() => {
    const seconds = this.visitor().averageSessionDuration;
    if (!seconds || seconds === 0) return '0m';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  });

  readonly tierIcon = computed(() => {
    const tier = this.leadScore()?.tier;
    switch (tier) {
      case 'hot': return '🔴';
      case 'warm': return '🟡';
      case 'cold': return '🔵';
      default: return '⚪';
    }
  });

  readonly tierLabel = computed(() => {
    const tier = this.leadScore()?.tier;
    switch (tier) {
      case 'hot': return 'Lead caliente';
      case 'warm': return 'Lead templado';
      case 'cold': return 'Lead frío';
      default: return 'Sin evaluar';
    }
  });

  readonly signalsTooltip = computed(() => {
    const signals = this.leadScore()?.signals;
    if (!signals) return '';

    const parts: string[] = [];
    if (signals.isRecurrentVisitor) parts.push('Visitante recurrente');
    if (signals.hasHighEngagement) parts.push('Alto engagement');
    if (signals.hasInvestedTime) parts.push('Tiempo invertido');
    if (signals.needsHelp) parts.push('Solicitó ayuda');

    return parts.join(' • ');
  });

  // === EVENT HANDLERS ===
  onClose(): void {
    this.close.emit();
  }

  onOpenUrl(): void {
    const url = this.visitor().currentUrl;
    if (url) {
      this.openUrl.emit(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  async onCopyUrl(): Promise<void> {
    const url = this.visitor().currentUrl;
    if (url) {
      await navigator.clipboard.writeText(url);
      this.urlCopied.set(true);
      setTimeout(() => this.urlCopied.set(false), 2000);
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
