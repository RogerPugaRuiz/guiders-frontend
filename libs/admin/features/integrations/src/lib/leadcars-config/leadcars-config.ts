import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LeadsService } from '@guiders-frontend/leads-service';
import {
  LeadCarsCompanyConfig,
  CreateLeadCarsConfigRequest,
  LeadCarsConfig,
  AVAILABLE_TRIGGER_EVENTS,
  LEADCARS_CONFIG_DEFAULTS,
  LEAD_TEMPERATURES,
  LEAD_TYPES,
  LeadCarsConcesionario,
  LeadCarsSede,
  LeadCarsCampana,
  LeadCarsTipoLead,
} from '@guiders-frontend/shared/types';

@Component({
  selector: 'lib-leadcars-config',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './leadcars-config.html',
  styleUrl: './leadcars-config.scss',
})
export class LeadCarsConfigComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leadsService = inject(LeadsService);
  private readonly destroyRef = inject(DestroyRef);

  // Estado reactivo
  readonly config = signal<LeadCarsCompanyConfig | null>(null);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly testing = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly testResult = signal<{ success: boolean; message: string } | null>(
    null
  );

  // Computed
  readonly hasConfig = computed(() => this.config() !== null);

  // Estado para datos de LeadCars (selectores dinámicos)
  readonly concesionarios = signal<LeadCarsConcesionario[]>([]);
  readonly sedes = signal<LeadCarsSede[]>([]);
  readonly campanas = signal<LeadCarsCampana[]>([]);
  readonly tiposLead = signal<LeadCarsTipoLead[]>([]);
  readonly loadingLeadCarsData = signal<boolean>(false);

  // Eventos de trigger disponibles
  readonly availableTriggerEvents = AVAILABLE_TRIGGER_EVENTS;

  // Tipos de lead y temperaturas disponibles
  readonly leadTypes = LEAD_TYPES;
  readonly leadTemperatures = LEAD_TEMPERATURES;

  // Formulario
  form: FormGroup = this.fb.group({
    enabled: [true],
    syncChatConversations: [true],
    triggerEvents: this.fb.group({
      lifecycle_changed_to_lead: [true],
      chat_closed: [false],
      contact_data_updated: [false],
    }),
    // Configuración específica de LeadCars
    clienteToken: ['', Validators.required],
    useSandbox: [LEADCARS_CONFIG_DEFAULTS.useSandbox],
    concesionarioId: [null],
    sedeId: [null],
    campanaId: [null],
    tipoLeadDefault: [LEADCARS_CONFIG_DEFAULTS.tipoLeadDefault],
    temperatureDefault: [LEADCARS_CONFIG_DEFAULTS.temperatureDefault],
    includeUrlOrigen: [LEADCARS_CONFIG_DEFAULTS.includeUrlOrigen],
    includeComentario: [LEADCARS_CONFIG_DEFAULTS.includeComentario],
  });

  ngOnInit(): void {
    this.loadConfig();
    this.subscribeToObservables();
    this.setupConcesionarioChangeListener();
  }

  private subscribeToObservables(): void {
    this.leadsService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => this.loading.set(loading));

    this.leadsService.saving$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saving) => this.saving.set(saving));

    this.leadsService.error$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((error) => this.error.set(error));

    this.leadsService.config$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config) => {
        this.config.set(config);
        if (config) {
          this.populateForm(config);
        }
      });

    // Suscribirse a datos de LeadCars
    this.leadsService.concesionarios$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.concesionarios.set(data));

    this.leadsService.sedes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.sedes.set(data));

    this.leadsService.campanas$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.campanas.set(data));

    this.leadsService.tiposLead$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.tiposLead.set(data));
  }

  /**
   * Escucha cambios en el concesionario seleccionado para cargar sedes y campañas
   */
  private setupConcesionarioChangeListener(): void {
    this.form
      .get('concesionarioId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((concesionarioId: number | null) => {
        // Limpiar sedes y campañas previas
        this.form.patchValue({ sedeId: null, campanaId: null });
        this.leadsService.clearSedesYCampanas();

        // Si hay concesionario seleccionado, cargar sedes y campañas
        if (concesionarioId) {
          this.loadSedesYCampanas(concesionarioId);
        }
      });
  }

  private loadConfig(): void {
    this.leadsService
      .getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Cargar datos de LeadCars (concesionarios y tipos de lead)
   */
  loadLeadCarsData(): void {
    if (this.concesionarios().length > 0) {
      return; // Ya están cargados
    }

    this.loadingLeadCarsData.set(true);

    // Cargar concesionarios y tipos de lead en paralelo
    this.leadsService
      .getConcesionarios()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        complete: () => this.loadingLeadCarsData.set(false),
        error: () => this.loadingLeadCarsData.set(false),
      });

    this.leadsService
      .getTiposLead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Cargar sedes y campañas de un concesionario
   */
  private loadSedesYCampanas(concesionarioId: number): void {
    this.leadsService
      .getSedes(concesionarioId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.leadsService
      .getCampanas(concesionarioId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private populateForm(config: LeadCarsCompanyConfig): void {
    const leadCarsConfig = config.config as LeadCarsConfig;

    this.form.patchValue({
      enabled: config.enabled,
      syncChatConversations: config.syncChatConversations,
      triggerEvents: {
        lifecycle_changed_to_lead: config.triggerEvents.includes(
          'lifecycle_changed_to_lead'
        ),
        chat_closed: config.triggerEvents.includes('chat_closed'),
        contact_data_updated: config.triggerEvents.includes(
          'contact_data_updated'
        ),
      },
      clienteToken: leadCarsConfig.clienteToken || '',
      useSandbox:
        leadCarsConfig.useSandbox ?? LEADCARS_CONFIG_DEFAULTS.useSandbox,
      concesionarioId: leadCarsConfig.concesionarioId || null,
      sedeId: leadCarsConfig.sedeId || null,
      campanaId: leadCarsConfig.campanaId || null,
      tipoLeadDefault:
        leadCarsConfig.tipoLeadDefault ||
        LEADCARS_CONFIG_DEFAULTS.tipoLeadDefault,
      temperatureDefault:
        leadCarsConfig.temperatureDefault ||
        LEADCARS_CONFIG_DEFAULTS.temperatureDefault,
      includeUrlOrigen:
        leadCarsConfig.includeUrlOrigen ??
        LEADCARS_CONFIG_DEFAULTS.includeUrlOrigen,
      includeComentario:
        leadCarsConfig.includeComentario ??
        LEADCARS_CONFIG_DEFAULTS.includeComentario,
    });

    // Cargar datos dinámicos de LeadCars
    this.loadLeadCarsData();

    // Si hay concesionario, cargar sus sedes y campañas
    if (leadCarsConfig.concesionarioId) {
      this.loadSedesYCampanas(leadCarsConfig.concesionarioId);
    }
  }

  private buildRequest(): CreateLeadCarsConfigRequest {
    const formValue = this.form.value;

    // Construir array de trigger events
    const triggerEvents: string[] = [];
    if (formValue.triggerEvents.lifecycle_changed_to_lead) {
      triggerEvents.push('lifecycle_changed_to_lead');
    }
    if (formValue.triggerEvents.chat_closed) {
      triggerEvents.push('chat_closed');
    }
    if (formValue.triggerEvents.contact_data_updated) {
      triggerEvents.push('contact_data_updated');
    }

    // Construir configuración específica de LeadCars
    const leadCarsConfig: LeadCarsConfig = {
      clienteToken: formValue.clienteToken,
      useSandbox: formValue.useSandbox,
      tipoLeadDefault: formValue.tipoLeadDefault,
      temperatureDefault: formValue.temperatureDefault,
      includeUrlOrigen: formValue.includeUrlOrigen,
      includeComentario: formValue.includeComentario,
      ...(formValue.concesionarioId && {
        concesionarioId: formValue.concesionarioId,
      }),
      ...(formValue.sedeId && { sedeId: formValue.sedeId }),
      ...(formValue.campanaId && { campanaId: formValue.campanaId }),
    };

    return {
      crmType: 'leadcars',
      enabled: formValue.enabled,
      syncChatConversations: formValue.syncChatConversations,
      triggerEvents,
      config: leadCarsConfig as unknown as Record<string, unknown>,
    };
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.testResult.set(null);

    const request = this.buildRequest();

    this.leadsService
      .saveConfig(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          // Error ya manejado por el servicio
        },
      });
  }

  onTestConnection(): void {
    const configId = this.config()?.id;
    if (!configId) {
      this.error.set('Guarda la configuración primero para probar la conexión');
      return;
    }

    this.testing.set(true);
    this.testResult.set(null);
    this.error.set(null);

    this.leadsService
      .testConnection(configId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.testResult.set(result);
          this.testing.set(false);
        },
        error: () => {
          this.testing.set(false);
        },
      });
  }

  onDelete(): void {
    const configId = this.config()?.id;
    if (!configId) return;

    if (
      !confirm(
        '¿Estás seguro de que deseas eliminar la configuración de LeadCars?'
      )
    ) {
      return;
    }

    this.leadsService
      .deleteConfig(configId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.form.reset({
            enabled: true,
            syncChatConversations: true,
            triggerEvents: {
              lifecycle_changed_to_lead: true,
              chat_closed: false,
              contact_data_updated: false,
            },
            useSandbox: LEADCARS_CONFIG_DEFAULTS.useSandbox,
            tipoLeadDefault: LEADCARS_CONFIG_DEFAULTS.tipoLeadDefault,
            temperatureDefault: LEADCARS_CONFIG_DEFAULTS.temperatureDefault,
            includeUrlOrigen: LEADCARS_CONFIG_DEFAULTS.includeUrlOrigen,
            includeComentario: LEADCARS_CONFIG_DEFAULTS.includeComentario,
          });
        },
      });
  }

  getTriggerEventLabel(event: string): string {
    const labels: Record<string, string> = {
      lifecycle_changed_to_lead: 'Cuando el visitante se convierte en lead',
      chat_closed: 'Cuando se cierra una conversación',
      contact_data_updated: 'Cuando se actualizan datos de contacto',
    };
    return labels[event] || event;
  }
}
