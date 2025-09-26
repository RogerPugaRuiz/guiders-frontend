import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BentoKpi } from './bento-kpi';

describe('BentoKpi', () => {
  let component: BentoKpi;
  let fixture: ComponentFixture<BentoKpi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BentoKpi],
    }).compileComponents();

    fixture = TestBed.createComponent(BentoKpi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
