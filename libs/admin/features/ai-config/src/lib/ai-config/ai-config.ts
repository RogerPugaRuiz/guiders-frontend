import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import {
  LlmConfigService,
  LlmConfig,
  UpdateLlmConfigRequest,
  LLM_CONFIG_DEFAULTS
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

  // Computed para mostrar valores formateados
  readonly temperatureDisplay = computed(() => this.temperature().toFixed(1));
  readonly delayDisplay = computed(() => `${this.responseDelayMs()}ms`);

  // Proveedores y modelos disponibles
  readonly providers = [
    { value: 'groq', label: 'Groq', available: true }
  ];

  readonly models: Record<string, { value: string; label: string }[]> = {
    groq: [
      { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
      { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' }
    ]
  };

  readonly availableModels = computed(() => {
    const provider = this.preferredProvider();
    return this.models[provider] || [];
  });

  // Verificar si hay cambios pendientes
  readonly hasChanges = computed(() => {
    const current = this.config();
    if (!current) return false;

    return (
      current.aiAutoResponseEnabled !== this.aiAutoResponseEnabled() ||
      current.aiSuggestionsEnabled !== this.aiSuggestionsEnabled() ||
      current.aiRespondWithCommercial !== this.aiRespondWithCommercial() ||
      current.preferredProvider !== this.preferredProvider() ||
      current.preferredModel !== this.preferredModel() ||
      (current.customSystemPrompt || '') !== this.customSystemPrompt() ||
      current.maxResponseTokens !== this.maxResponseTokens() ||
      current.temperature !== this.temperature() ||
      current.responseDelayMs !== this.responseDelayMs()
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

    // Primero obtener el siteId de la empresa del usuario, luego cargar la config
    this.visitorsDataService.getCompanySites()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(companySites => {
          // Usar el companyId como siteId
          const siteId = companySites.companyId;
          this.siteId.set(siteId);
          console.log('[AiConfig] SiteId obtenido:', siteId);
          return this.llmConfigService.getConfig(siteId);
        })
      )
      .subscribe({
        next: (config) => {
          this.config.set(config);
          this.syncFormWithConfig(config);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando configuracion:', err);
          this.error.set('Error al cargar la configuracion');
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
    // Resetear modelo al cambiar proveedor
    const models = this.models[value];
    if (models && models.length > 0) {
      this.preferredModel.set(models[0].value);
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
      customSystemPrompt: this.customSystemPrompt() || undefined,
      maxResponseTokens: this.maxResponseTokens(),
      temperature: this.temperature(),
      responseDelayMs: this.responseDelayMs()
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
          console.error('Error guardando configuracion:', err);
          this.error.set('Error al guardar la configuracion');
          this.saving.set(false);
        }
      });
  }

  onResetToDefaults(): void {
    if (!confirm('¿Estas seguro de restablecer la configuracion a los valores por defecto?')) {
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
          console.error('Error restableciendo configuracion:', err);
          this.error.set('Error al restablecer la configuracion');
          this.saving.set(false);
        }
      });
  }
}
