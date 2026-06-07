import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentRegistry } from './component-registry.service';

describe(ComponentRegistry.name, () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  describe('registerSlot', () => {
    it('stores component and updates registeredSlots signal', () => {
      class TestComponent {}
      registry.registerSlot('test-slot', TestComponent);
      expect(registry.getSlot('test-slot')).toBe(TestComponent);
      expect(registry.registeredSlots().has('test-slot')).toBe(true);
    });

    it('overwrites existing component for same slot name', () => {
      class TestComponent1 {}
      class TestComponent2 {}
      registry.registerSlot('test-slot', TestComponent1);
      registry.registerSlot('test-slot', TestComponent2);
      expect(registry.getSlot('test-slot')).toBe(TestComponent2);
    });
  });

  describe('unregisterSlot', () => {
    it('removes component from registry', () => {
      class TestComponent {}
      registry.registerSlot('test-slot', TestComponent);
      registry.unregisterSlot('test-slot');
      expect(registry.getSlot('test-slot')).toBeUndefined();
    });

    it('does not throw when unregistering non-existent slot', () => {
      expect(() => registry.unregisterSlot('non-existent')).not.toThrow();
    });
  });

  describe('getSlot', () => {
    it('returns undefined for unregistered slot', () => {
      expect(registry.getSlot('non-existent')).toBeUndefined();
    });

    it('returns registered component', () => {
      class TestComponent {}
      registry.registerSlot('test-slot', TestComponent);
      expect(registry.getSlot('test-slot')).toBe(TestComponent);
    });
  });

  describe('slotCount', () => {
    it('returns 0 for empty registry', () => {
      expect(registry.slotCount()).toBe(0);
    });

    it('reflects map size after registrations', () => {
      class TestComponent1 {}
      class TestComponent2 {}
      registry.registerSlot('slot-1', TestComponent1);
      registry.registerSlot('slot-2', TestComponent2);
      expect(registry.slotCount()).toBe(2);
    });

    it('decrements after unregister', () => {
      class TestComponent1 {}
      class TestComponent2 {}
      registry.registerSlot('slot-1', TestComponent1);
      registry.registerSlot('slot-2', TestComponent2);
      registry.unregisterSlot('slot-1');
      expect(registry.slotCount()).toBe(1);
    });
  });
});