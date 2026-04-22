import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadcarsStatusPanel } from './leadcars-status-panel';

describe('LeadcarsStatusPanel', () => {
  let component: LeadcarsStatusPanel;
  let fixture: ComponentFixture<LeadcarsStatusPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadcarsStatusPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadcarsStatusPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
