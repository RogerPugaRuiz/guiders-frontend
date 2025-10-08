# Angular 20: Computed Signals + OnPush Change Detection Issue

## Problem Discovered

After implementing `detectChanges()` correctly, the button **still remained visible** even though the `pendingChatIds` array was updated correctly in the state. This revealed a deeper issue specific to **Angular 20's computed signals** with **OnPush change detection strategy**.

## Root Cause: Computed Signal Lazy Evaluation

### The Flow

```typescript
// Parent Component (visitors.ts)
readonly state = signal<VisitorsState>({
  visitors: [],
  // ...
});

readonly filteredVisitors = computed(() => {
  const state = this.state();
  let visitors = state.visitors;
  // ... filtering logic
  return visitors;
});

// Template binding
// [visitors]="filteredVisitors()"
```

### What Goes Wrong

1. **State update inside async callback**:
```typescript
this.visitorsService.assignChatToCommercial(chatId, userId)
  .subscribe(response => {
    // ✅ Update state with new array
    this.updateState({ visitors: updatedVisitors });
    
    // ❌ Problem: computed() hasn't re-evaluated yet!
    this.cdr.detectChanges();
  });
```

2. **Computed signal lazy evaluation**:
   - Computed signals in Angular are **lazy** - they only re-compute when accessed
   - `this.updateState()` updates the source signal (`state`)
   - But `filteredVisitors()` computed won't re-evaluate until **something reads it**
   - Calling `detectChanges()` **before** the computed re-evaluates means Angular checks with the **old cached value**

3. **Result**:
   - Child component receives **old array** through `[visitors]` binding
   - `@if (visitor.pendingChatIds.length > 0)` evaluates with **stale data**
   - Button remains visible ❌

## Solution: Force Computed Re-evaluation

### Before (Broken)

```typescript
this.updateState({ 
  visitors: updatedVisitors 
});

// ❌ Computed hasn't re-evaluated yet
this.cdr.detectChanges();
```

### After (Fixed)

```typescript
this.updateState({ 
  visitors: updatedVisitors 
});

// 🔑 CRITICAL: Force computed re-evaluation by reading it
const currentFiltered = this.filteredVisitors();
console.log('Filtered visitors:', currentFiltered.length);

// ✅ Now detectChanges() will use fresh computed value
this.cdr.detectChanges();
```

## Why This Works

1. **Reading the computed**: `const currentFiltered = this.filteredVisitors();`
   - Forces the computed signal to **re-evaluate immediately**
   - Computed reads `this.state().visitors` (which has new array)
   - Applies filters and returns **fresh array**

2. **Then detect changes**: `this.cdr.detectChanges();`
   - Angular checks template bindings
   - `[visitors]="filteredVisitors()"` now returns the **fresh array**
   - Child component receives updated array
   - `@if` re-evaluates with correct `pendingChatIds.length`
   - Button disappears ✅

## Angular 20 Specific Behavior

### Documentation Reference

From Angular 20 docs on computed signals:

> Computed signals are **lazily evaluated** and **memoize** their values. The computation function is only re-run when:
> 1. The computed signal is read AND
> 2. One of its dependencies has changed

### Key Point

In **synchronous code**, this works fine:
```typescript
state.set(newValue);
const computed = filteredData(); // Reads immediately, gets fresh value
```

But in **async callbacks** (like `subscribe`), you need to explicitly trigger the read:
```typescript
service.getData().subscribe(data => {
  state.set(newValue);
  // Must read computed BEFORE detectChanges()
  const fresh = filteredData();
  cdr.detectChanges();
});
```

## OnPush Amplifies the Problem

With `ChangeDetectionStrategy.OnPush`:
- Component only checks bindings when explicitly triggered
- If computed hasn't re-evaluated, binding gets **cached old value**
- Calling `detectChanges()` with stale computed = UI shows old data

With `ChangeDetectionStrategy.Default`:
- Angular checks more frequently
- May accidentally read computed during a check cycle
- Problem might be hidden (but still exists)

## Complete Fix Implementation

```typescript
// In onTakePendingChatAutomatically()
this.visitorsService.assignChatToCommercial(chatId, userId)
  .pipe(
    catchError(error => {
      this.visitorsListComponent?.markAsCompleted(visitorId);
      return of(null);
    })
  )
  .subscribe(response => {
    if (response?.success) {
      // 1️⃣ Update state signal
      const updatedVisitors = currentVisitors.map(visitor => {
        if (visitor.id === visitorId) {
          return {
            ...visitor,
            pendingChatIds: visitor.pendingChatIds.filter(id => id !== chatId)
          };
        }
        return visitor;
      });
      
      this.updateState({ visitors: updatedVisitors });
      
      // 2️⃣ Force computed re-evaluation
      const currentFiltered = this.filteredVisitors();
      console.log('Filtered after update:', currentFiltered.length);
      
      // 3️⃣ Trigger change detection with fresh data
      this.cdr.detectChanges();
      
      // 4️⃣ Clean up processing state
      this.visitorsListComponent?.markAsCompleted(visitorId);
    }
  });
```

## Debugging Tips

### Add Logging to Verify Computed Re-evaluation

```typescript
readonly filteredVisitors = computed(() => {
  console.log('🔄 filteredVisitors computed RE-EVALUATING');
  const state = this.state();
  // ... filtering logic
  return visitors;
});
```

### Expected Log Sequence

```
✅ Correct sequence:
1. Estado actualizado en signal
2. 🔄 filteredVisitors computed RE-EVALUATING  ← Triggered by reading it
3. Filtered visitors: 5
4. ✅ detectChanges() ejecutado
5. [UI updates with fresh data]

❌ Wrong sequence (without forced read):
1. Estado actualizado en signal
2. ✅ detectChanges() ejecutado
3. [No computed re-evaluation log]
4. [UI shows stale data]
```

## Alternative Solutions (Not Implemented)

### Option 1: Use Effect Instead of Computed

```typescript
readonly visitors = signal<Visitor[]>([]);
readonly filteredVisitors = signal<Visitor[]>([]);

constructor() {
  effect(() => {
    const visitors = this.state().visitors;
    // Apply filters
    this.filteredVisitors.set(filtered);
  });
}
```

**Why not**: More verbose, effect runs even when filtered not needed

### Option 2: Manual Subscription with BehaviorSubject

```typescript
private visitorsSubject = new BehaviorSubject<Visitor[]>([]);
readonly visitors$ = this.visitorsSubject.asObservable();

// In template: [visitors]="visitors$ | async"
```

**Why not**: Loses benefits of signals, requires async pipe

### Option 3: Change to Default Strategy

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.Default
})
```

**Why not**: Performance degradation for large lists

## Files Modified

### `/libs/chat/features/visitors/src/lib/visitors/visitors.ts`

**Lines ~807-812**:
```typescript
// Added: Force computed re-evaluation
const currentFiltered = this.filteredVisitors();
console.log('Filtered visitors después de actualizar:', currentFiltered.length);
console.log('Visitante en filtered:', currentFiltered.find(v => v.id === data.visitor.id));
```

## Testing

### Verify Computed Re-evaluation

Open browser console and look for:
```
Estado actualizado en signal
Filtered visitors después de actualizar: 5
Visitante en filtered: {id: "...", pendingChatIds: []}  ← Empty array!
✅ detectChanges() ejecutado - botón debería desaparecer
```

### Verify UI Update

1. Click "Ver chats pendientes" button
2. **Console should show**: `pendingChatIds length: 0`
3. **Console should show**: Computed re-evaluation log
4. **UI should show**: Button disappears immediately ✅

## Key Takeaways

1. **Computed signals are lazy**: They don't re-evaluate until **read**

2. **Async callbacks need manual read**: Inside `subscribe()`, must explicitly read computed before `detectChanges()`

3. **OnPush + Computed = Explicit**: With OnPush, you MUST control when computed re-evaluates

4. **Read before detect**: Pattern is always:
   ```typescript
   signal.set(newValue);
   const fresh = computed(); // Force re-evaluation
   cdr.detectChanges();    // Apply to UI
   ```

5. **This is documented Angular behavior**: Not a bug, it's how computed signals are designed for performance

## References

- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Computed Signals Documentation](https://angular.dev/guide/signals#computed-signals)
- [OnPush Change Detection](https://angular.dev/api/core/ChangeDetectionStrategy)

## Status

✅ **RESOLVED** - Button now disappears immediately by forcing computed re-evaluation before detectChanges()
✅ **Angular 20 Compatible** - Solution works with signal-based architecture
✅ **Performance Optimized** - OnPush strategy maintained, minimal overhead
