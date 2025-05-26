import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserStatusService } from '../../core/services/user-status.service';
import { BehaviorSubject, combineLatest } from 'rxjs';

@Component({
  selector: 'app-user-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-badge" [class.user-badge--compact]="compact">
      <div class="user-badge__avatar" *ngIf="!hideAvatar">
        <span>{{ userInitial | async }}</span>
        <span class="user-badge__status-indicator" [class]="userStatusService.getStatusClass()"></span>
      </div>
      
      <div class="user-badge__info" *ngIf="!compact">
        <div class="user-badge__name" *ngIf="userName | async as name">{{ name }}</div>
        <div class="user-badge__details">
          <span class="user-badge__role" *ngIf="userRole | async as role">
            {{ getRoleDisplayName(role) }}
          </span>
          <div class="user-badge__status" *ngIf="userStatusService.userStatus$ | async as status">
            <span class="user-badge__status-dot" [class]="userStatusService.getStatusClass()"></span>
            <span class="user-badge__status-text">{{ userStatusService.getStatusText() }}</span>
          </div>
        </div>
      </div>
      
      <!-- Versión compacta -->
      <div class="user-badge__compact-info" *ngIf="compact">
        <span class="user-badge__compact-role" *ngIf="userRole | async as role">
          {{ getRoleDisplayName(role) }}
        </span>
        <span class="user-badge__compact-status">{{ userStatusService.getStatusText() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .user-badge {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      background-color: var(--color-surface);
      border-radius: 8px;
      border: 1px solid var(--color-border);

      &--compact {
        padding: var(--spacing-xs) var(--spacing-sm);
        gap: var(--spacing-xs);
      }

      &__avatar {
        position: relative;
        width: 32px;
        height: 32px;
        background-color: var(--color-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-weight: 600;
        font-size: var(--font-size-sm);
        flex-shrink: 0;
      }

      &__status-indicator {
        position: absolute;
        bottom: -1px;
        right: -1px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid var(--color-surface);
        
        &.status--online {
          background-color: #3fb950;
        }
        
        &.status--offline {
          background-color: #8b949e;
        }
        
        &.status--away {
          background-color: #f6a33a;
        }
      }

      &__info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        flex: 1;
      }

      &__name {
        font-weight: 500;
        font-size: var(--font-size-sm);
        color: var(--color-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &__details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      &__role {
        font-size: var(--font-size-xs);
        color: var(--color-primary);
        font-weight: 500;
        background-color: var(--color-primary-background);
        padding: 1px 4px;
        border-radius: 2px;
        align-self: flex-start;
        white-space: nowrap;
      }

      &__status {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      &__status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        
        &.status--online {
          background-color: #3fb950;
        }
        
        &.status--offline {
          background-color: #8b949e;
        }
        
        &.status--away {
          background-color: #f6a33a;
        }
      }

      &__status-text {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      }

      &__compact-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
        font-size: var(--font-size-xs);
      }

      &__compact-role {
        color: var(--color-primary);
        font-weight: 500;
      }

      &__compact-status {
        color: var(--color-text-secondary);
      }
    }
  `]
})
export class UserBadgeComponent {
  @Input() compact = false; // Versión compacta
  @Input() hideAvatar = false; // Ocultar avatar
  @Input() hideStatus = false; // Ocultar estado de conexión

  private authService = inject(AuthService);
  userStatusService = inject(UserStatusService);

  userInitial = new BehaviorSubject<string>('U');
  userName = new BehaviorSubject<string>('');
  userRole = new BehaviorSubject<string>('');

  constructor() {
    this.loadUserData();
  }

  private loadUserData(): void {
    this.authService.getSession().subscribe({
      next: (session) => {
        if (session?.user) {
          const initial = session.user.email ? session.user.email.charAt(0).toUpperCase() : 'U';
          this.userInitial.next(initial);
          this.userName.next(session.user.name || session.user.email || '');
          this.userRole.next(session.user.role || 'user');
        }
      },
      error: () => {
        // Fallback: intentar obtener desde getCurrentUser
        this.authService.getCurrentUser().subscribe({
          next: (user) => {
            if (user) {
              const initial = user.email ? user.email.charAt(0).toUpperCase() : 'U';
              this.userInitial.next(initial);
              this.userName.next(user.name || user.email || '');
              this.userRole.next(user.role || 'user');
            }
          },
          error: (error) => {
            console.error('Error al cargar datos del usuario:', error);
          }
        });
      }
    });
  }

  getRoleDisplayName(role: string): string {
    const roleNames = {
      'admin': 'Administrador',
      'user': 'Usuario',
      'guide': 'Guía',
      'moderator': 'Moderador',
      'manager': 'Gerente',
      'support': 'Soporte'
    };

    return roleNames[role as keyof typeof roleNames] || 'Usuario';
  }
}
