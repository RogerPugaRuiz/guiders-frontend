import { Injectable, signal, computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withHooks, patchState } from '@ngrx/signals';

/**
 * Interfaz para los elementos de la caché
 */
export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Tipo para la clave de caché
 */
export type CacheKey = string;

/**
 * Estado inicial de la caché
 */
interface CacheState {
  items: Map<CacheKey, CacheItem>;
  pendingRequests: Map<CacheKey, Promise<any>>;
  stats: {
    size: number;
    hits: number;
    misses: number;
  };
}

/**
 * SignalStore para gestión de caché con limpieza automática
 */
export const CacheStore = signalStore(
  { providedIn: 'root' },
  withState<CacheState>({
    items: new Map<CacheKey, CacheItem>(),
    pendingRequests: new Map<CacheKey, Promise<any>>(),
    stats: {
      size: 0,
      hits: 0,
      misses: 0
    }
  }),
  withMethods((store) => {
    // Configuración de caché
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
    let cleanupInterval: number | null = null;

    return {
      /**
       * Inicia la limpieza automática de caché
       */
      startCleanup(): void {
        if (cleanupInterval) return;
        
        cleanupInterval = window.setInterval(() => {
          this.cleanExpired();
        }, 60 * 1000); // Limpiar cada minuto
      },

      /**
       * Detiene la limpieza automática
       */
      stopCleanup(): void {
        if (cleanupInterval) {
          clearInterval(cleanupInterval);
          cleanupInterval = null;
        }
      },

      /**
       * Genera una clave de caché basada en método y parámetros
       */
      generateKey(method: string, params?: any): CacheKey {
        const paramsStr = params ? JSON.stringify(params) : '';
        return `${method}:${paramsStr}`;
      },

      /**
       * Obtiene un elemento de la caché si es válido, o una petición pendiente
       */
      get<T>(key: CacheKey): T | null {
        const items = store.items();
        const item = items.get(key);
        
        console.log('🔍 CacheStore.get - clave:', key);
        console.log('📊 Items en caché:', items.size);
        console.log('🎯 Item encontrado:', !!item);
        
        if (!item) {
          // Incrementar misses
          patchState(store, (state) => ({
            stats: {
              ...state.stats,
              misses: state.stats.misses + 1
            }
          }));
          return null;
        }

        const now = Date.now();
        if (now > item.expiresAt) {
          // Item expirado, eliminarlo
          console.log('⏰ Item expirado, eliminando');
          this.delete(key);
          patchState(store, (state) => ({
            stats: {
              ...state.stats,
              misses: state.stats.misses + 1
            }
          }));
          return null;
        }

        // Item válido, incrementar hits
        console.log('✅ Item válido encontrado en caché');
        patchState(store, (state) => ({
          stats: {
            ...state.stats,
            hits: state.stats.hits + 1
          }
        }));

        return item.data as T;
      },

      /**
       * Método de conveniencia para obtener datos o ejecutar una función si no existe
       */
      async getOrSet<T>(key: CacheKey, fetchFn: () => Promise<T>): Promise<T> {
        // Primero intentar obtener de caché
        const cachedResult = this.get<T>(key);
        if (cachedResult !== null) {
          console.log('✅ Devolviendo desde caché');
          return cachedResult;
        }

        // Verificar si ya hay una petición pendiente
        const pendingRequest = this.getPendingRequest<T>(key);
        if (pendingRequest) {
          console.log('⏳ Esperando petición pendiente');
          return pendingRequest;
        }

        // No hay caché ni petición pendiente, ejecutar la función
        console.log('🌐 Ejecutando nueva petición');
        const promise = fetchFn();
        
        // Registrar como petición pendiente
        this.setPendingRequest(key, promise);

        try {
          const result = await promise;
          // Almacenar en caché
          this.set(key, result);
          return result;
        } catch (error) {
          // Re-lanzar el error sin almacenar en caché
          throw error;
        }
      },

      /**
       * Almacena un elemento en la caché
       */
      set<T>(key: CacheKey, data: T): void {
        console.log('💾 CacheStore.set - clave:', key);
        console.log('📦 Data a almacenar:', !!data);
        
        const now = Date.now();
        const item: CacheItem<T> = {
          data,
          timestamp: now,
          expiresAt: now + CACHE_DURATION
        };

        const newItems = new Map(store.items());
        newItems.set(key, item);
        
        console.log('📊 Nuevo tamaño de caché:', newItems.size);

        patchState(store, {
          items: newItems,
          stats: {
            ...store.stats(),
            size: newItems.size
          }
        });
        
        console.log('✅ Item almacenado en caché exitosamente');
      },

      /**
       * Verifica si hay una petición pendiente para una clave
       */
      hasPendingRequest(key: CacheKey): boolean {
        return store.pendingRequests().has(key);
      },

      /**
       * Obtiene una petición pendiente para una clave
       */
      getPendingRequest<T>(key: CacheKey): Promise<T> | null {
        const pending = store.pendingRequests().get(key);
        return pending as Promise<T> || null;
      },

      /**
       * Registra una petición pendiente para una clave
       */
      setPendingRequest<T>(key: CacheKey, promise: Promise<T>): void {
        console.log('⏳ Registrando petición pendiente para:', key);
        
        const newPendingRequests = new Map(store.pendingRequests());
        newPendingRequests.set(key, promise);
        
        patchState(store, {
          pendingRequests: newPendingRequests
        });

        // Limpiar la petición pendiente cuando termine (éxito o error)
        promise.finally(() => {
          console.log('🏁 Limpiando petición pendiente para:', key);
          const updatedPendingRequests = new Map(store.pendingRequests());
          updatedPendingRequests.delete(key);
          
          patchState(store, {
            pendingRequests: updatedPendingRequests
          });
        });
      },

      /**
       * Elimina un elemento específico de la caché
       */
      delete(key: CacheKey): boolean {
        const newItems = new Map(store.items());
        const deleted = newItems.delete(key);

        if (deleted) {
          patchState(store, {
            items: newItems,
            stats: {
              ...store.stats(),
              size: newItems.size
            }
          });
        }

        return deleted;
      },

      /**
       * Invalida elementos de caché que contengan un patrón específico
       */
      invalidatePattern(pattern: string): number {
        const items = store.items();
        const keysToDelete: string[] = [];

        for (const [key] of items.entries()) {
          if (key.includes(pattern)) {
            keysToDelete.push(key);
          }
        }

        const newItems = new Map(items);
        keysToDelete.forEach(key => newItems.delete(key));

        patchState(store, {
          items: newItems,
          stats: {
            ...store.stats(),
            size: newItems.size
          }
        });

        return keysToDelete.length;
      },

      /**
       * Limpia elementos expirados de la caché
       */
      cleanExpired(): number {
        const items = store.items();
        const now = Date.now();
        const newItems = new Map<CacheKey, CacheItem>();
        let deletedCount = 0;

        for (const [key, item] of items.entries()) {
          if (now <= item.expiresAt) {
            newItems.set(key, item);
          } else {
            deletedCount++;
          }
        }

        if (deletedCount > 0) {
          patchState(store, {
            items: newItems,
            stats: {
              ...store.stats(),
              size: newItems.size
            }
          });
        }

        return deletedCount;
      },

      /**
       * Limpia toda la caché
       */
      clear(): void {
        patchState(store, {
          items: new Map<CacheKey, CacheItem>(),
          stats: {
            size: 0,
            hits: 0,
            misses: 0
          }
        });
      },

      /**
       * Obtiene las estadísticas de la caché
       */
      getStats(): { 
        size: number; 
        hits: number; 
        misses: number; 
        hitRate: number;
        keys: string[] 
      } {
        const stats = store.stats();
        const items = store.items();
        const totalRequests = stats.hits + stats.misses;
        
        return {
          ...stats,
          hitRate: totalRequests > 0 ? (stats.hits / totalRequests) * 100 : 0,
          keys: Array.from(items.keys())
        };
      }
    };
  }),
  withHooks({
    onInit(store) {
      // Iniciar limpieza automática al inicializar
      store.startCleanup();
    },
    onDestroy(store) {
      // Detener limpieza y limpiar al destruir
      store.stopCleanup();
      store.clear();
    }
  })
);
