import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([])
      ],
      declarations: [],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'backoffice' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('backoffice');
  });
});
