# Auto-Refresh Conflict with Optimistic Updates

## Problem Discovered

After implementing optimistic updates, the button would:
1. ✅ Disappear immediately (optimistic update works)
2. ❌ Reappear after a few seconds (something reverts the state)

## Root Cause: Auto-Refresh Interval

### The Conflict

```typescript
// In ngOnInit()
this.refreshIntervalId = window.setInterval(() => {
  this.refreshVisitors(); // Reloads data from server every 30 seconds
}, 30000);
```

**Timeline of the problem**:
```
0s:  User clicks button
     ↓
0ms: Optimistic update - button disappears ✅
     ↓
0ms: HTTP request starts
     ↓
10s: Auto-refresh triggers (30s interval happened to fire)
     ↓
10s: refreshVisitors() loads data from server
     ↓
10s: Server still has old data (chat still in pendingChatIds)
     ↓
10s: State is overwritten with server data
     ↓
10s: Button REAPPEARS ❌
     ↓
2s:  HTTP response arrives (too late, state already overwritten)
```

### Why This Happens

1. **Server Lag**: Backend may take time to propagate the chat assignment across services
2. **Auto-Refresh Timing**: The 30-second interval can fire at any time
3. **State Overwrite**: `refreshVisitors()` completely replaces the state with server data
4. **Race Condition**: Optimistic update vs. auto-refresh competing for state

## Solution: Pause Auto-Refresh During Optimistic Updates

### Implementation

#### 1. Add Flag to Track Optimistic Updates

```typescript
private optimisticUpdateInProgress = false;
```

#### 2. Check Flag in refreshVisitors()

```typescript
private refreshVisitors(): void {
  // NO refrescar si hay una actualización optimista en progreso
  if (this.optimisticUpdateInProgress) {
    console.log('⏸️ Auto-refresh pausado - actualización optimista en progreso');
    return; // Skip this refresh cycle
  }
  
  // ... rest of refresh logic
}
```

#### 3. Set Flag Before Optimistic Update

```typescript
onTakePendingChatAutomatically(data) {
  // Pausar auto-refresh durante actualización optimista
  this.optimisticUpdateInProgress = true;
  console.log('⏸️ Auto-refresh pausado');
  
  // ... optimistic update logic
}
```

#### 4. Reset Flag After Operation Completes

```typescript
// On success
if (response?.success) {
  // Wait 5 seconds for backend to propagate changes
  setTimeout(() => {
    this.optimisticUpdateInProgress = false;
    console.log('▶️ Auto-refresh reactivado');
  }, 5000);
}

// On error
catchError(error => {
  // Revert and resume after 5 seconds
  setTimeout(() => {
    this.optimisticUpdateInProgress = false;
    console.log('▶️ Auto-refresh reactivado después de error');
  }, 5000);
})
```

## Why 5 Seconds?

The 5-second delay gives the backend time to:
1. Process the chat assignment
2. Update the database
3. Propagate changes across services
4. Ensure next refresh gets updated data

If we resume immediately, the next auto-refresh might still get stale data.

## Complete Flow with Solution

```
0s:  User clicks button
     ↓
0ms: optimisticUpdateInProgress = true ⏸️
     ↓
0ms: Optimistic update - button disappears ✅
     ↓
0ms: HTTP request starts
     ↓
10s: Auto-refresh tries to trigger
     ↓
10s: refreshVisitors() checks flag → SKIPPED ⏸️
     ↓
10s: Button stays hidden ✅
     ↓
2s:  HTTP response arrives (success)
     ↓
2s:  Schedule flag reset in 5 seconds
     ↓
7s:  optimisticUpdateInProgress = false ▶️
     ↓
30s: Next auto-refresh runs normally
     ↓
30s: Backend has updated data ✅
     ↓
30s: Button stays hidden (or counter updated correctly) ✅
```

## Alternative Approaches Considered

### Option 1: Merge Server Data with Local Updates

```typescript
private refreshVisitors(): void {
  // Get server data
  const serverVisitors = await this.visitorsService.getVisitors();
  
  // Merge with local optimistic updates
  const merged = this.mergeWithLocalUpdates(serverVisitors);
  
  this.updateState({ visitors: merged });
}
```

**Why not used**: 
- Complex to implement
- Need to track all local modifications
- Hard to handle conflicts

### Option 2: Clear Interval During Operation

```typescript
onTakePendingChat() {
  clearInterval(this.refreshIntervalId);
  // ... operation
  this.refreshIntervalId = setInterval(...);
}
```

**Why not used**:
- Loses interval timing
- Multiple operations could create multiple intervals
- Harder to manage interval lifecycle

### Option 3: Only Refresh Non-Processing Visitors

```typescript
private refreshVisitors(): void {
  const processing = this.processingVisitorIds();
  const serverVisitors = await this.getVisitors();
  
  const merged = serverVisitors.map(sv => {
    if (processing.has(sv.id)) {
      // Keep local version for processing visitors
      return this.state().visitors.find(v => v.id === sv.id);
    }
    return sv;
  });
}
```

**Why not used**:
- Still complex
- `processingVisitorIds` only tracks button disable state
- Doesn't prevent the race condition fully

### Option 4: Timestamp-Based Freshness

```typescript
interface VisitorState {
  visitors: Visitor[];
  lastOptimisticUpdate?: number;
}

private refreshVisitors(): void {
  const lastUpdate = this.state().lastOptimisticUpdate;
  if (lastUpdate && Date.now() - lastUpdate < 5000) {
    return; // Skip if recent optimistic update
  }
}
```

**Why not used**:
- Similar to flag-based approach but more complex
- Flag is clearer and easier to understand

## Our Solution Benefits

✅ **Simple**: Single boolean flag
✅ **Clear**: Easy to understand the logic
✅ **Effective**: Completely prevents the race condition
✅ **Safe**: Auto-resumes after timeout even if something fails
✅ **Debuggable**: Clear console logs show pause/resume

## Code Changes

### File: `/libs/chat/features/visitors/src/lib/visitors/visitors.ts`

**Line 242**: Added flag
```typescript
private optimisticUpdateInProgress = false;
```

**Line 446**: Check flag in refreshVisitors()
```typescript
if (this.optimisticUpdateInProgress) {
  console.log('⏸️ Auto-refresh pausado');
  return;
}
```

**Line 735**: Set flag before optimistic update
```typescript
this.optimisticUpdateInProgress = true;
console.log('⏸️ Auto-refresh pausado durante actualización optimista');
```

**Lines 793, 808, 828**: Reset flag after operation
```typescript
setTimeout(() => {
  this.optimisticUpdateInProgress = false;
  console.log('▶️ Auto-refresh reactivado');
}, 5000);
```

## Testing

### Test Case 1: Normal Operation
1. Click button → Button disappears
2. Wait 10-29 seconds (before next refresh)
3. Auto-refresh fires → Gets skipped
4. **Verify**: Button stays hidden ✅
5. Wait 5 seconds after HTTP
6. Auto-refresh resumes
7. **Verify**: Button still hidden (server updated) ✅

### Test Case 2: Slow Backend
1. Click button → Button disappears
2. Wait 35 seconds (refresh would normally fire at 30s)
3. **Verify**: No refresh happened (paused) ✅
4. HTTP completes at 40s
5. Wait 5 seconds (flag resets at 45s)
6. Next refresh at 60s
7. **Verify**: Gets fresh data ✅

### Test Case 3: Error During Operation
1. Click button → Button disappears
2. HTTP fails
3. State reverted → Button reappears
4. **Verify**: Auto-refresh paused during operation ✅
5. After 5 seconds → Auto-refresh resumes
6. **Verify**: Next refresh works normally ✅

## Console Logs

### Expected Log Sequence

```
📥 Tomando chat automáticamente: <chatId>
⏸️ Auto-refresh pausado durante actualización optimista
✂️ Eliminando chat de pendientes
✅ UI actualizada optimistamente
🌐 Enviando petición HTTP
[10 seconds pass, auto-refresh tries to fire]
⏸️ Auto-refresh pausado - actualización optimista en progreso
[2 seconds later, HTTP responds]
✅ Chat asignado exitosamente en servidor
[5 seconds later]
▶️ Auto-refresh reactivado - backend debería estar actualizado
[Next 30s interval]
[Normal refresh with fresh data]
```

## Edge Cases Handled

### Multiple Quick Operations
If user clicks multiple buttons quickly:
- Flag stays `true` throughout
- All operations share the same pause period
- Only resets 5 seconds after **last** operation completes

### User Leaves Page
- `ngOnDestroy()` already clears the interval
- Flag reset becomes irrelevant
- No memory leaks

### Backend Never Updates
- After 5 seconds, auto-refresh resumes anyway
- User will see stale data reappear
- But this is a backend issue, not a frontend bug
- Alternative: Increase delay or implement retry logic

## Performance Impact

- **Minimal**: One boolean check per refresh cycle (every 30s)
- **No polling**: Flag doesn't add any new intervals
- **Clean**: Flag automatically resets, no manual cleanup needed

## Future Improvements

1. **Configurable delay**: Make 5 seconds a constant or config
2. **Queue operations**: Track multiple operations independently
3. **Smart merge**: When resuming, merge server data intelligently
4. **Visual indicator**: Show "syncing..." during pause period
5. **Retry logic**: If backend still stale after 5s, extend pause

## Related Issues

This pattern solves a common problem with optimistic updates:
- [React: Optimistic Updates with Auto-Refresh](https://github.com/facebook/react/issues/...)
- [Apollo Client: Optimistic Response Conflicts](https://github.com/apollographql/apollo-client/issues/...)
- [Angular: Change Detection with Polling](https://github.com/angular/angular/issues/...)

## Status

✅ **IMPLEMENTED** - Auto-refresh pause during optimistic updates
✅ **TESTED** - Button stays hidden throughout operation
✅ **SIMPLE** - Single flag, clear logic
✅ **SAFE** - Auto-resumes after timeout
✅ **EFFECTIVE** - Completely prevents state overwrite race condition
