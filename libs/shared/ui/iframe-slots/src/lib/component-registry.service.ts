import { Injectable, computed, signal, type Type } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ComponentRegistry {
  private readonly _registeredSlots = signal<Map<string, Type<unknown>>>(new Map());

  readonly registeredSlots = this._registeredSlots.asReadonly();

  readonly slotCount = computed(() => this._registeredSlots().size);

  registerSlot(slotName: string, component: Type<unknown>): void {
    const slots = new Map(this._registeredSlots());
    slots.set(slotName, component);
    this._registeredSlots.set(slots);
  }

  unregisterSlot(slotName: string): void {
    const slots = new Map(this._registeredSlots());
    slots.delete(slotName);
    this._registeredSlots.set(slots);
  }

  getSlot(slotName: string): Type<unknown> | undefined {
    return this._registeredSlots().get(slotName);
  }
}