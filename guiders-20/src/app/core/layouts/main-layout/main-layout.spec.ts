import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MainLayout } from './main-layout';
import { MOCK_AUTH_PROVIDERS } from '../../testing/auth.mocks';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        ...MOCK_AUTH_PROVIDERS
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
