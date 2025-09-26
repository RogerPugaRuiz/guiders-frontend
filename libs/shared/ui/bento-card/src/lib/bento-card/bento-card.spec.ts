import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BentoCard } from './bento-card';

describe('BentoCard', () => {
  let component: BentoCard;
  let fixture: ComponentFixture<BentoCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoCard],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
