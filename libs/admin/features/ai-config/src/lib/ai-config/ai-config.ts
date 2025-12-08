import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, forkJoin } from 'rxjs';
import {
  LlmConfigService,
  LlmConfig,
  UpdateLlmConfigRequest,
  LlmProvider,
  LLM_CONFIG_DEFAULTS,
  LLM_TOOL_CONFIG_DEFAULTS
} from '@guiders-frontend/llm-config-service';
import { VisitorsDataService } from '@guiders-frontend/visitors-data-service';

@Component({
  selector: 'admin-ai-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-config.html',
  styleUrl: './ai-config.scss',
})
export class AiConfig implements OnInit, OnDestroy {
  private readonly llmConfigService = inject(LlmConfigService);
  private readonly visitorsDataService = inject(VisitorsDataService);
  private readonly destroy$ = new Subject<void>();
  private readonly promptUpdate$ = new Subject<string>();

  // siteId obtenido dinamicamente desde la empresa del usuario
  private readonly siteId = signal<string>('');

  // Estado del componente
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Configuracion
  readonly config = signal<LlmConfig | null>(null);

  // Valores del formulario
  readonly aiAutoResponseEnabled = signal<boolean>(LLM_CONFIG_DEFAULTS.aiAutoResponseEnabled);
  readonly aiSuggestionsEnabled = signal<boolean>(LLM_CONFIG_DEFAULTS.aiSuggestionsEnabled);
  readonly aiRespondWithCommercial = signal<boolean>(LLM_CONFIG_DEFAULTS.aiRespondWithCommercial);
  readonly preferredProvider = signal<string>(LLM_CONFIG_DEFAULTS.preferredProvider);
  readonly preferredModel = signal<string>(LLM_CONFIG_DEFAULTS.preferredModel);
  readonly customSystemPrompt = signal<string>('');
  readonly maxResponseTokens = signal<number>(LLM_CONFIG_DEFAULTS.maxResponseTokens);
  readonly temperature = signal<number>(LLM_CONFIG_DEFAULTS.temperature);
  readonly responseDelayMs = signal<number>(LLM_CONFIG_DEFAULTS.responseDelayMs);

  // Tool Use Config Signals
  readonly fetchPageEnabled = signal<boolean>(LLM_TOOL_CONFIG_DEFAULTS.fetchPageEnabled);
  readonly baseUrl = signal<string>(LLM_TOOL_CONFIG_DEFAULTS.baseUrl);
  readonly allowedPaths = signal<string[]>([...LLM_TOOL_CONFIG_DEFAULTS.allowedPaths]);
  readonly maxIterations = signal<number>(LLM_TOOL_CONFIG_DEFAULTS.maxIterations);
  readonly fetchTimeoutMs = signal<number>(LLM_TOOL_CONFIG_DEFAULTS.fetchTimeoutMs);
  readonly cacheEnabled = signal<boolean>(LLM_TOOL_CONFIG_DEFAULTS.cacheEnabled);
  readonly cacheTtlSeconds = signal<number>(LLM_TOOL_CONFIG_DEFAULTS.cacheTtlSeconds);
  readonly newPathInput = signal<string>('');

  // Computed para mostrar valores formateados
  readonly temperatureDisplay = computed(() => this.temperature().toFixed(1));
  readonly delayDisplay = computed(() => `${this.responseDelayMs()}ms`);

  // Tool Use computed displays
  readonly fetchTimeoutDisplay = computed(() => `${(this.fetchTimeoutMs() / 1000).toFixed(0)}s`);
  readonly cacheTtlDisplay = computed(() => {
    const seconds = this.cacheTtlSeconds();
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    if (seconds < 86400) {
      const hours = Math.round(seconds / 3600);
      return hours === 1 ? '1 hora' : `${hours} horas`;
    }
    const days = Math.round(seconds / 86400);
    return days === 1 ? '1 dia' : `${days} dias`;
  });

  // Proveedores y modelos desde el API
  readonly providers = signal<LlmProvider[]>([]);
  readonly defaultProvider = signal<string>('');
  readonly defaultModel = signal<string>('');

  readonly availableModels = computed(() => {
    const providerId = this.preferredProvider();
    const provider = this.providers().find(p => p.id === providerId);
    return provider?.models.filter(m => m.isActive) || [];
  });

  // Verificar si hay cambios pendientes
  readonly hasChanges = computed(() => {
    const current = this.config();
    if (!current) return false;

    const currentToolConfig = current.toolConfig || LLM_TOOL_CONFIG_DEFAULTS;

    return (
      current.aiAutoResponseEnabled !== this.aiAutoResponseEnabled() ||
      current.aiSuggestionsEnabled !== this.aiSuggestionsEnabled() ||
      current.aiRespondWithCommercial !== this.aiRespondWithCommercial() ||
      current.preferredProvider !== this.preferredProvider() ||
      current.preferredModel !== this.preferredModel() ||
      (current.customSystemPrompt || '') !== this.customSystemPrompt() ||
      current.maxResponseTokens !== this.maxResponseTokens() ||
      current.temperature !== this.temperature() ||
      current.responseDelayMs !== this.responseDelayMs() ||
      // Tool Config comparisons
      currentToolConfig.fetchPageEnabled !== this.fetchPageEnabled() ||
      (currentToolConfig.baseUrl || '') !== this.baseUrl() ||
      JSON.stringify(currentToolConfig.allowedPaths) !== JSON.stringify(this.allowedPaths()) ||
      currentToolConfig.maxIterations !== this.maxIterations() ||
      currentToolConfig.fetchTimeoutMs !== this.fetchTimeoutMs() ||
      currentToolConfig.cacheEnabled !== this.cacheEnabled() ||
      currentToolConfig.cacheTtlSeconds !== this.cacheTtlSeconds()
    );
  });

  ngOnInit(): void {
    this.loadConfig();
    this.setupPromptDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadConfig(): void {
    this.loading.set(true);
    this.error.set(null);

    // Primero obtener el siteId de la empresa del usuario
    this.visitorsDataService.getCompanySites()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(companySites => {
          // Usar el siteId real del API
          const siteId = companySites.siteId;
          this.siteId.set(siteId);
          console.log('[AiConfig] SiteId obtenido:', siteId);

          // Cargar proveedores y config en paralelo
          return forkJoin({
            providers: this.llmConfigService.getProviders(),
            config: this.llmConfigService.getConfig(siteId)
          });
        })
      )
      .subscribe({
        next: ({ providers, config }) => {
          // Guardar proveedores
          this.providers.set(providers.providers.filter(p => p.isActive));
          this.defaultProvider.set(providers.defaultProvider);
          this.defaultModel.set(providers.defaultModel);
          console.log('[AiConfig] Proveedores cargados:', providers);

          // Guardar config
          this.config.set(config);
          this.syncFormWithConfig(config);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando configuración:', err);
          this.error.set('Error al cargar la configuración');
          this.loading.set(false);
        }
      });
  }

  private syncFormWithConfig(config: LlmConfig): void {
    this.aiAutoResponseEnabled.set(config.aiAutoResponseEnabled);
    this.aiSuggestionsEnabled.set(config.aiSuggestionsEnabled);
    this.aiRespondWithCommercial.set(config.aiRespondWithCommercial);
    this.preferredProvider.set(config.preferredProvider);
    this.preferredModel.set(config.preferredModel);
    this.customSystemPrompt.set(config.customSystemPrompt || '');
    this.maxResponseTokens.set(config.maxResponseTokens);
    this.temperature.set(config.temperature);
    this.responseDelayMs.set(config.responseDelayMs);

    // Sincronizar Tool Config
    const toolConfig = config.toolConfig || LLM_TOOL_CONFIG_DEFAULTS;
    this.fetchPageEnabled.set(toolConfig.fetchPageEnabled);
    this.baseUrl.set(toolConfig.baseUrl || '');
    this.allowedPaths.set([...toolConfig.allowedPaths]);
    this.maxIterations.set(toolConfig.maxIterations);
    this.fetchTimeoutMs.set(toolConfig.fetchTimeoutMs);
    this.cacheEnabled.set(toolConfig.cacheEnabled);
    this.cacheTtlSeconds.set(toolConfig.cacheTtlSeconds);
    this.newPathInput.set('');
  }

  private setupPromptDebounce(): void {
    this.promptUpdate$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.customSystemPrompt.set(value);
      });
  }

  // Handlers de cambios
  onToggleAutoResponse(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.aiAutoResponseEnabled.set(checked);
  }

  onToggleSuggestions(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.aiSuggestionsEnabled.set(checked);
  }

  onToggleRespondWithCommercial(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.aiRespondWithCommercial.set(checked);
  }

  onProviderChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.preferredProvider.set(value);
    // Resetear modelo al cambiar proveedor - usar el modelo por defecto o el primero disponible
    const provider = this.providers().find(p => p.id === value);
    if (provider) {
      const defaultModel = provider.models.find(m => m.isDefault && m.isActive);
      const firstActiveModel = provider.models.find(m => m.isActive);
      this.preferredModel.set(defaultModel?.id || firstActiveModel?.id || '');
    }
  }

  onModelChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.preferredModel.set(value);
  }

  onTemperatureChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.temperature.set(value);
  }

  onMaxTokensChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (value >= 50 && value <= 2000) {
      this.maxResponseTokens.set(value);
    }
  }

  onDelayChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (value >= 0 && value <= 5000) {
      this.responseDelayMs.set(value);
    }
  }

  onPromptChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.promptUpdate$.next(value);
  }

  // Tool Use Handlers
  onToggleFetchPage(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.fetchPageEnabled.set(checked);
  }

  onBaseUrlChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.baseUrl.set(value);
  }

  onAddPath(): void {
    const path = this.newPathInput().trim();
    if (path && !this.allowedPaths().includes(path)) {
      this.allowedPaths.update(paths => [...paths, path]);
      this.newPathInput.set('');
    }
  }

  onRemovePath(path: string): void {
    this.allowedPaths.update(paths => paths.filter(p => p !== path));
  }

  onPathInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onAddPath();
    }
  }

  onPathInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.newPathInput.set(value);
  }

  onMaxIterationsChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (value >= 1 && value <= 10) {
      this.maxIterations.set(value);
    }
  }

  onFetchTimeoutChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (value >= 1000 && value <= 30000) {
      this.fetchTimeoutMs.set(value);
    }
  }

  onToggleCache(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.cacheEnabled.set(checked);
  }

  onCacheTtlChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (value >= 60 && value <= 86400) {
      this.cacheTtlSeconds.set(value);
    }
  }

  onCancel(): void {
    const current = this.config();
    if (current) {
      this.syncFormWithConfig(current);
    }
    this.successMessage.set(null);
    this.error.set(null);
  }

  onSave(): void {
    if (!this.hasChanges()) return;

    this.saving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const updates: UpdateLlmConfigRequest = {
      aiAutoResponseEnabled: this.aiAutoResponseEnabled(),
      aiSuggestionsEnabled: this.aiSuggestionsEnabled(),
      aiRespondWithCommercial: this.aiRespondWithCommercial(),
      preferredProvider: this.preferredProvider(),
      preferredModel: this.preferredModel(),
      customSystemPrompt: this.customSystemPrompt().trim() || null,
      maxResponseTokens: this.maxResponseTokens(),
      temperature: this.temperature(),
      responseDelayMs: this.responseDelayMs(),
      toolConfig: {
        fetchPageEnabled: this.fetchPageEnabled(),
        baseUrl: this.baseUrl().trim(),
        allowedPaths: this.allowedPaths(),
        maxIterations: this.maxIterations(),
        fetchTimeoutMs: this.fetchTimeoutMs(),
        cacheEnabled: this.cacheEnabled(),
        cacheTtlSeconds: this.cacheTtlSeconds()
      }
    };

    this.llmConfigService.updateConfig(this.siteId(), updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.config.set(config);
          this.saving.set(false);
          this.successMessage.set('Configuracion guardada correctamente');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Error guardando configuración:', err);
          this.error.set('Error al guardar la configuración');
          this.saving.set(false);
        }
      });
  }

  onResetToDefaults(): void {
    if (!confirm('¿Estás seguro de restablecer la configuración a los valores por defecto?')) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.llmConfigService.deleteConfig(this.siteId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadConfig();
          this.successMessage.set('Configuracion restablecida');
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Error restableciendo configuración:', err);
          this.error.set('Error al restablecer la configuración');
          this.saving.set(false);
        }
      });
  }
}
