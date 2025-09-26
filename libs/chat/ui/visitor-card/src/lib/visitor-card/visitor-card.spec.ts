import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorCard } from './visitor-card';

describe('VisitorCard', () => {
  let component: VisitorCard;
  let fixture: ComponentFixture<VisitorCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorCard],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
