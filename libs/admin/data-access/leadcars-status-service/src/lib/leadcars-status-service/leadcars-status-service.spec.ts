import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadcarsStatusService } from './leadcars-status-service';

describe('LeadcarsStatusService', () => {
  let component: LeadcarsStatusService;
  let fixture: ComponentFixture<LeadcarsStatusService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadcarsStatusService],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadcarsStatusService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
