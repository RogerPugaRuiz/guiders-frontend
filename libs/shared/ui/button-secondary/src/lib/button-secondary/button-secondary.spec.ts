import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonSecondary } from './button-secondary';

describe('ButtonSecondary', () => {
  let component: ButtonSecondary;
  let fixture: ComponentFixture<ButtonSecondary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonSecondary],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonSecondary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
