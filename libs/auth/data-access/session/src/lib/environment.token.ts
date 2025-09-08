import { InjectionToken } from '@angular/core';
import { Environment } from '@guiders-frontend/shared/types';

export const ENVIRONMENT_TOKEN = new InjectionToken<Environment>('Environment');
