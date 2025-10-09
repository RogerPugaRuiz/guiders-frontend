import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ENVIRONMENT_TOKEN } from '@guiders-frontend/auth/data-access/session';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ENVIRONMENT_TOKEN,
          useValue: {
            production: false,
            api: {
              baseUrl: 'http://localhost:3000'
            },
            ws: {
              url: 'http://localhost:3000'
            }
          }
        }
      ]
    }).compileComponents();
  });

  it('should create component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
