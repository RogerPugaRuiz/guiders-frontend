import { Component, ElementRef, HostListener, inject, OnInit, OnDestroy, computed, signal, viewChild, effect } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { ColorThemeService } from '../../services/color-theme.service';
import { ThemeStateService } from '../../services/theme-state.service';
import { WebSocketService } from '../../services/websocket.service';
import { SideMenu } from '../../components/side-menu/side-menu';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, SideMenu],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private storageService = inject(StorageService);
  private colorThemeService = inject(ColorThemeService);
  private themeStateService = inject(ThemeStateService);
  private webSocketService = inject(WebSocketService);
  private destroy$ = new Subject<void>();

  // ViewChild moderno con signals
  profileMenu = viewChild<ElementRef>('profileMenu');

  // Signals para el estado del componente
  showProfileMenu = signal(false);

  // Computed signals para la información del usuario
  currentUser = computed(() => this.authService.currentUser());
  userEmail = computed(() => this.currentUser()?.email || '');
  userInitial = computed(() => {
    const email = this.userEmail();
    return email ? email.charAt(0).toUpperCase() : 'U';
  });
  currentUserRole = computed(() => this.currentUser()?.role || '');

  // Computed signals para el estado del WebSocket
  isWebSocketConnected = computed(() => this.webSocketService.isConnected());
  webSocketError = computed(() => this.webSocketService.connectionError());
  isWebSocketConnecting = computed(() => this.webSocketService.isConnecting());
  
  constructor() {
    // Effect para manejar cambios de tema
    effect(() => {
      const isDarkMode = this.themeStateService.isDarkMode();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        this.storageService.setItem('theme', isDarkMode ? 'dark' : 'light');
      }
    });

    // Effect para monitorear el estado del WebSocket
    effect(() => {
      const connected = this.isWebSocketConnected();
      const error = this.webSocketError();
      
      if (connected) {
        console.log('✅ WebSocket conectado en MainLayout');
      } else if (error) {
        console.warn('⚠️ Error en WebSocket:', error);
      }
    });
  }

  ngOnInit(): void {
    // Inicializar el sistema de temas
    this.initializeTheme();
    
    // Verificar el estado de autenticación al inicializar
    this.authService.checkAuthenticationStatus().pipe(
      takeUntil(this.destroy$)
    ).subscribe();

    // Suscribirse a los mensajes del WebSocket
    this.webSocketService.getMessages().pipe(
      takeUntil(this.destroy$)
    ).subscribe(message => {
      this.handleWebSocketMessage(message);
    });

    // Suscribirse a notificaciones específicas
    this.webSocketService.getMessagesByType('notification').pipe(
      takeUntil(this.destroy$)
    ).subscribe(notification => {
      console.log('🔔 Notificación recibida en MainLayout:', notification);
      // Aquí puedes agregar lógica para mostrar notificaciones en la UI
    });

    // Remover la clase que oculta el contenido una vez inicializado
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('theme-initializing');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Método para mostrar/ocultar el menú de perfil
  toggleProfileMenu(): void {
    this.showProfileMenu.update(current => !current);
  }

  // Cerrar el menú al hacer clic fuera de él
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const profileMenuEl = this.profileMenu();
    if (profileMenuEl && !profileMenuEl.nativeElement.contains(event.target)) {
      this.showProfileMenu.set(false);
    }
  }

  // Método para cerrar sesión
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Sesión cerrada correctamente');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
      }
    });
  }

  // Método para generar un mensaje de bienvenida más humano y amigable
  getWelcomeMessage(role: string): string {
    const messages = {
      'admin': '¡Hola Administrador! Hoy vas a hacer cosas increíbles ✨',
      'commercial': '¡Hola Comercial! Que tengas un día lleno de éxitos 🚀',
      'user': '¡Hola! Bienvenido de vuelta 👋'
    };

    return messages[role as keyof typeof messages] || '¡Hola! Bienvenido 👋';
  }

  // Método para obtener el nombre legible del rol del usuario
  getRoleDisplayName(role: string): string {
    const roleNames = {
      'admin': 'Administrador',
      'commercial': 'Comercial',
      'user': 'Usuario'
    };

    return roleNames[role as keyof typeof roleNames] || 'Usuario';
  }

  /**
   * Inicializa el sistema de temas y colores
   */
  private initializeTheme(): void {
    // Verificar si hay un tema guardado en localStorage
    const savedTheme = this.storageService.getItem('theme');
    
    if (savedTheme) {
      this.themeStateService.setDarkMode(savedTheme === 'dark');
    } else {
      // Detectar preferencia del sistema
      const prefersDarkMode = typeof window !== 'undefined' && 
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeStateService.setDarkMode(prefersDarkMode);
      this.storageService.setItem('theme', prefersDarkMode ? 'dark' : 'light');
    }

    // Aplicar el tema al DOM usando effect de signals
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.themeStateService.isDarkMode() ? 'dark' : 'light');
    }

    // Inicializar color primario personalizado
    const savedColor = this.storageService.getItem('primaryColor');
    if (savedColor) {
      this.colorThemeService.changePrimaryColor(savedColor);
    } else {
      // Aplicar color por defecto
      const currentColor = this.colorThemeService.getSelectedColor();
      if (currentColor) {
        this.colorThemeService.applyPrimaryColor(currentColor);
      }
    }
  }

  /**
   * Maneja los mensajes recibidos del WebSocket
   */
  private handleWebSocketMessage(message: any): void {
    console.log('📨 Mensaje WebSocket recibido en MainLayout:', message);
    
    switch (message.type) {
      case 'user_status_change':
        console.log('👤 Cambio de estado de usuario:', message.data);
        break;
      case 'notification':
        console.log('🔔 Notificación:', message.data);
        // Aquí puedes agregar lógica para mostrar notificaciones en la UI
        break;
      case 'chat_message':
        console.log('💬 Mensaje de chat:', message.data);
        break;
      default:
        console.log('📝 Mensaje genérico:', message);
    }
  }
}
