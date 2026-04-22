import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeatIndexBadge } from './heat-index-badge';

describe('HeatIndexBadge', () => {
  let component: HeatIndexBadge;
  let fixture: ComponentFixture<HeatIndexBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatIndexBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(HeatIndexBadge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
