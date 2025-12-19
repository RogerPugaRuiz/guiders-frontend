import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LeadsService } from '@guiders-frontend/leads-service';
import {
  CrmType,
  CrmCompanyConfig,
  CreateCrmConfigRequest,
  LeadCarsConfig,
  AVAILABLE_TRIGGER_EVENTS,
  LEADCARS_CONFIG_DEFAULTS,
} from '@guiders-frontend/shared/types';

@Component({
  selector: 'lib-crm-config',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crm-config.html',
  styleUrl: './crm-config.scss',
})
export class CrmConfig implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly leadsService = inject(LeadsService);
  private readonly destroyRef = inject(DestroyRef);

  // Estado reactivo
  readonly config = signal<CrmCompanyConfig | null>(null);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly testing = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly testResult = signal<{ success: boolean; message: string } | null>(null);
  readonly supportedCrmTypes = signal<CrmType[]>([]);

  // Computed
  readonly hasConfig = computed(() => this.config() !== null);
  readonly isLeadCars = computed(() => this.form.get('crmType')?.value === 'leadcars');

  // Eventos de trigger disponibles
  readonly availableTriggerEvents = AVAILABLE_TRIGGER_EVENTS;

  // Formulario
  form: FormGroup = this.fb.group({
    crmType: ['leadcars', Validators.required],
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
  });

  ngOnInit(): void {
    this.loadSupportedCrmTypes();
    this.loadConfig();
    this.subscribeToObservables();
  }

  private subscribeToObservables(): void {
    this.leadsService.loading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => this.loading.set(loading));

    this.leadsService.saving$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(saving => this.saving.set(saving));

    this.leadsService.error$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(error => this.error.set(error));

    this.leadsService.config$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(config => {
        this.config.set(config);
        if (config) {
          this.populateForm(config);
        }
      });

    this.leadsService.supportedCrmTypes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(types => this.supportedCrmTypes.set(types));
  }

  private loadSupportedCrmTypes(): void {
    this.leadsService.getSupportedCrmTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private loadConfig(): void {
    this.leadsService.getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private populateForm(config: CrmCompanyConfig): void {
    const leadCarsConfig = config.config as LeadCarsConfig;

    this.form.patchValue({
      crmType: config.crmType,
      enabled: config.enabled,
      syncChatConversations: config.syncChatConversations,
      triggerEvents: {
        lifecycle_changed_to_lead: config.triggerEvents.includes('lifecycle_changed_to_lead'),
        chat_closed: config.triggerEvents.includes('chat_closed'),
        contact_data_updated: config.triggerEvents.includes('contact_data_updated'),
      },
      clienteToken: leadCarsConfig.clienteToken || '',
      useSandbox: leadCarsConfig.useSandbox ?? LEADCARS_CONFIG_DEFAULTS.useSandbox,
      concesionarioId: leadCarsConfig.concesionarioId || null,
      sedeId: leadCarsConfig.sedeId || null,
      campanaId: leadCarsConfig.campanaId || null,
      tipoLeadDefault: leadCarsConfig.tipoLeadDefault || LEADCARS_CONFIG_DEFAULTS.tipoLeadDefault,
    });
  }

  private buildRequest(): CreateCrmConfigRequest {
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
      ...(formValue.concesionarioId && { concesionarioId: formValue.concesionarioId }),
      ...(formValue.sedeId && { sedeId: formValue.sedeId }),
      ...(formValue.campanaId && { campanaId: formValue.campanaId }),
      ...(formValue.tipoLeadDefault && { tipoLeadDefault: formValue.tipoLeadDefault }),
    };

    return {
      crmType: formValue.crmType,
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

    this.leadsService.saveConfig(request)
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

    this.leadsService.testConnection(configId)
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

    if (!confirm('¿Estás seguro de que deseas eliminar la configuración de CRM?')) {
      return;
    }

    this.leadsService.deleteConfig(configId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.form.reset({
            crmType: 'leadcars',
            enabled: true,
            syncChatConversations: true,
            triggerEvents: {
              lifecycle_changed_to_lead: true,
              chat_closed: false,
              contact_data_updated: false,
            },
            useSandbox: LEADCARS_CONFIG_DEFAULTS.useSandbox,
            tipoLeadDefault: LEADCARS_CONFIG_DEFAULTS.tipoLeadDefault,
          });
        },
      });
  }

  getCrmTypeLabel(type: CrmType): string {
    const labels: Record<CrmType, string> = {
      leadcars: 'LeadCars',
      hubspot: 'HubSpot',
      salesforce: 'Salesforce',
    };
    return labels[type] || type;
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
