import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityStatCard } from './activity-stat-card';

describe('ActivityStatCard', () => {
  let component: ActivityStatCard;
  let fixture: ComponentFixture<ActivityStatCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityStatCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityStatCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
