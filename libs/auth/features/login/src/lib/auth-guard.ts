// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (_route, state) => {
  return false; // Placeholder for actual implementation
};
