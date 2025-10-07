import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonTertiary } from './button-tertiary';

describe('ButtonTertiary', () => {
  let component: ButtonTertiary;
  let fixture: ComponentFixture<ButtonTertiary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonTertiary],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonTertiary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
