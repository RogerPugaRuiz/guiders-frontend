import { Component, ElementRef, HostListener, inject, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { AsyncPipe, CommonModule } from '@angular/common';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { ColorThemeService } from '../services/color-theme.service';
import { AuthService } from '../services/auth.service';
import { UserStatusService } from '../services/user-status.service';
import { WebSocketService } from '../services/websocket.service';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, SideMenuComponent, ThemeToggleComponent, AsyncPipe, CommonModule],
  template: `
    <header class="gh-header">
      <div class="gh-header__container">
        <div class="gh-header__logo">
          <h1>Guiders</h1>
            <span class="gh-header__welcome">
              {{ getWelcomeMessage(currentUserRole() || '') }}
            </span>
        </div>
        <div class="gh-header__nav">
          <a href="#" class="gh-header__nav-item">Documentación</a>
          <a href="#" class="gh-header__nav-item">Soporte</a>
          <app-theme-toggle></app-theme-toggle>
          <div class="gh-header__profile" (click)="toggleProfileMenu()" #profileMenu>
            <div class="gh-avatar gh-avatar--sm">
              <span>{{ userInitial | async }}</span>
            </div>
            @if (showProfileMenu) {
              <div class="gh-header__profile-menu">
                <div class="gh-header__profile-info">
                  <span class="gh-header__profile-email">{{ userEmail | async }}</span>
                </div>
                <div class="gh-header__profile-actions">
                  <a routerLink="/settings/profile" class="gh-header__profile-action">Perfil</a>
                  <button class="gh-header__profile-action gh-header__profile-action--logout" (click)="logout()">Cerrar sesión</button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </header>
    <div class="gh-layout">
      <app-side-menu class="gh-layout__sidebar"></app-side-menu>
      <main class="gh-layout__main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .gh-header {
      border-bottom: 1px solid var(--color-border);
      background-color: var(--color-header-bg);
      color: white;
      padding: var(--spacing-sm) var(--spacing-md);
      position: sticky;
      top: 0;
      z-index: 30;
      
      &__container {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      &__logo {
        h1 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
        }
      }
      
      &__welcome {
        font-size: var(--font-size-xs);
        color: rgba(255, 255, 255, 0.8);
        margin-left: var(--spacing-sm);
        font-weight: 400;
        
        &--loading {
          opacity: 0.7;
          animation: pulse 2s infinite;
        }
        
        &--placeholder {
          opacity: 0.6;
          font-style: italic;
        }
      }
      
      @keyframes pulse {
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
      }
      
      &__nav {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
      }
      
      &__nav-item {
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-size: var(--font-size-sm);
        
        &:hover {
          color: white;
          text-decoration: none;
        }
      }
      
      &__profile {
        cursor: pointer;
        position: relative;
      }

      &__profile-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 8px;
        width: 200px;
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1;
        overflow: hidden;
      }

      &__profile-info {
        padding: var(--spacing-md);
        border-bottom: 1px solid var(--color-border);
      }

      &__profile-email {
        font-size: var(--font-size-xs);
        color: var(--color-text);
        word-break: break-all;
        display: block;
        margin-bottom: var(--spacing-xs);
      }

      &__user-details {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      &__user-role {
        font-size: var(--font-size-xs);
        color: var(--color-primary);
        font-weight: 500;
        background-color: var(--color-primary-background);
        padding: 2px 6px;
        border-radius: 3px;
        align-self: flex-start;
      }

      &__user-status {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      &__status-indicator {
        width: 8px;
        height: 8px;
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

      &__profile-actions {
        display: flex;
        flex-direction: column;
      }

      &__profile-action {
        padding: var(--spacing-sm) var(--spacing-md);
        font-size: var(--font-size-sm);
        color: var(--color-text);
        text-decoration: none;
        display: block;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        width: 100%;

        &:hover {
          background-color: var(--color-hover);
        }

        &--logout {
          border-top: 1px solid var(--color-border);
          color: var(--color-danger);
        }
      }
    }
    
    .gh-layout {
      display: flex;
      height: calc(100vh - 50px); /* Restar altura del header */
      width: 100vw;
      overflow: hidden;

      &__sidebar {
        width: 256px;
        height: 100%;
        border-right: 1px solid var(--color-border);
        background-color: var(--color-sidebar-bg);
      }

      &__main {
        flex: 1;
        padding: var(--spacing-lg) var(--spacing-xl);
        overflow-y: auto;
        background-color: var(--color-background);
      }
    }
    
    .gh-avatar {
      width: 32px;
      height: 32px;
      background-color: #2da44e;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-weight: 600;
      
      &--sm {
        width: 24px;
        height: 24px;
        font-size: 12px;
      }
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private websocketService = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  // Servicios públicos para usar en el template
  userStatusService = inject(UserStatusService);

  // ViewChild para el menú desplegable
  @ViewChild('profileMenu') profileMenuElement!: ElementRef;

  userInitial = new BehaviorSubject<string>(''); // Valor predeterminado mientras carga
  userEmail = new BehaviorSubject<string>(''); // Email completo para mostrar en el menú
  userRole = new BehaviorSubject<string>(''); // Rol del usuario para el mensaje de bienvenida
  showProfileMenu = false; // Controla la visibilidad del menú desplegable

  constructor(
    private colorThemeService: ColorThemeService,
    private storageService: StorageService
  ) {
    // Inicializar color y tema al cargar el componente de layout
    // Esto se asegura de que las variables CSS estén correctamente configuradas
    this.initializeTheme();

    // Suscribirse a los cambios de color
    this.colorThemeService.colorChange$.subscribe(color => {
      if (color) {
        console.log('Layout detectó cambio de color a:', color);
        // El color ya se aplica en el servicio, no necesitamos hacer nada más aquí
      }
    });
  }

  ngOnInit(): void {
    // Verificar primero si hay una sesión guardada
    console.log('LayoutComponent ngOnInit - Verificando sesión...');

    // Inicializar conexión WebSocket para comunicación en tiempo real
    this.initializeWebSocket();

    // Primero intentar obtener de la sesión local, luego del endpoint
    this.authService.getSession().subscribe({
      next: (session) => {
        if (session?.user?.email) {
          // Usar los datos de la sesión local
          const initial = session.user.email.charAt(0).toUpperCase();
          this.userInitial.next(initial);
          this.userEmail.next(session.user.email);
          this.userRole.next(session.user.role || 'user');
          console.log('Usuario obtenido de sesión local:', session.user.email);
        } else {
          // Si no hay sesión local, intentar con el endpoint
          this.getCurrentUserFromAPI();
        }
      },
      error: (error) => {
        console.error('Error al obtener sesión local:', error);
        // Intentar con el endpoint como fallback
        this.getCurrentUserFromAPI();
      }
    });
  }

  private getCurrentUserFromAPI(): void {
    // Obtener el usuario actual del endpoint y extraer la inicial del correo
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('Usuario obtenido exitosamente desde API:', user);
        if (user && user.email) {
          const initial = user.email.charAt(0).toUpperCase();
          this.userInitial.next(initial);
          this.userEmail.next(user.email);
          this.userRole.next(user.role || 'user');
          console.log('Inicial obtenida del correo:', initial);
        } else {
          // Si no hay usuario o email, dejamos el valor por defecto 'U'
          console.log('No se pudo obtener el correo del usuario - usuario es null o sin email');
        }
      },
      error: (error) => {
        console.error('Error al obtener el usuario desde API:', error);
        console.error('Tipo de error:', error.constructor.name);
        console.error('Mensaje del error:', error.message);
        console.error('Status del error:', error.status || 'N/A');

        // Verificar si hay datos en storage
        const token = this.storageService.getItem('guiders_auth_token');
        const session = this.storageService.getItem('guiders_session');
        console.log('Token en storage:', token ? 'SÍ existe' : 'NO existe');
        console.log('Sesión en storage:', session ? 'SÍ existe' : 'NO existe');

        // En caso de error, dejamos el valor por defecto 'U'
      }
    });
  }

  // Método para mostrar/ocultar el menú de perfil
  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  // Cerrar el menú al hacer clic fuera de él
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.profileMenuElement && !this.profileMenuElement.nativeElement.contains(event.target)) {
      this.showProfileMenu = false;
    }
  }

  // Método para cerrar sesión
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada correctamente');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
      }
    });
  }

  // Método para obtener el rol actual del usuario
  currentUserRole(): string | null {
    return this.userRole.value || null;
  }

  // Método para generar un mensaje de bienvenida más humano y amigable
  getWelcomeMessage(role: string): string {
    const messages = {
      'admin': '¡Hola Administrador! Hoy vas a hacer cosas increíbles ✨',
      'commercial': '¡Hola Comercial! Que tengas un día lleno de éxitos 🚀'
    };

    return messages[role as keyof typeof messages] || '';
  }

  // Método para obtener el nombre legible del rol del usuario
  getRoleDisplayName(role: string): string {
    const roleNames = {
      'admin': 'Administrador',
      'commercial': 'Comercial'
    };

    return roleNames[role as keyof typeof roleNames] || 'Usuario';
  }

  private initializeTheme(): void {
    // El ColorThemeService ya tiene lógica para inicializar colores
    // Solo necesitamos garantizar que se instancie aquí y se aplique el color actual
    const currentColor = this.colorThemeService.getSelectedColor();
    if (currentColor) {
      this.colorThemeService.applyPrimaryColor(currentColor);
    }
  }

  /**
   * Inicializa la conexión WebSocket para comunicación en tiempo real
   */
  private initializeWebSocket(): void {
    console.log('LayoutComponent: Inicializando WebSocket...');
    
    // Verificar la sesión de autenticación antes de conectar al WebSocket
    this.authService.getSession().subscribe({
      next: (session) => {
        if (session?.token) {
          this.websocketService.connect();
          
          // Suscribirse al estado de conexión para logs
          this.websocketService.getConnectionState()
            .pipe(takeUntil(this.destroy$))
            .subscribe(state => {
              console.log('WebSocket estado:', state);
              
              if (state.connected) {
                console.log('✅ WebSocket conectado exitosamente');
              } else if (state.error) {
                console.warn('⚠️ WebSocket error:', state.error);
              }
            });

          // Suscribirse a mensajes del WebSocket
          this.websocketService.getMessages()
            .pipe(takeUntil(this.destroy$))
            .subscribe(message => {
              console.log('📨 Mensaje WebSocket recibido:', message);
              this.handleWebSocketMessage(message);
            });
        } else {
          console.warn('LayoutComponent: No se puede inicializar WebSocket, no hay sesión de autenticación válida');
        }
      },
      error: (error) => {
        console.error('LayoutComponent: Error al verificar sesión para WebSocket:', error);
      }
    });
  }

  /**
   * Maneja los mensajes recibidos del WebSocket
   */
  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'user_status_change':
        console.log('Estado de usuario cambiado:', message.data);
        // Aquí se pueden manejar cambios de estado de usuarios
        break;
      
      case 'notification':
        console.log('Nueva notificación:', message.data);
        // Aquí se pueden mostrar notificaciones en tiempo real
        break;
      
      case 'chat_message':
        console.log('Nuevo mensaje de chat:', message.data);
        // Aquí se pueden manejar mensajes de chat en tiempo real
        break;
      
      default:
        console.log('Mensaje WebSocket no manejado:', message);
    }
  }

  ngOnDestroy(): void {
    console.log('LayoutComponent: Limpiando recursos...');
    this.destroy$.next();
    this.destroy$.complete();
    
    // Desconectar WebSocket al salir del layout
    this.websocketService.disconnect();
  }
}
