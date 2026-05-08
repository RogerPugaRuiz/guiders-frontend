import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  LeadCarsStatusPanelComponent,
  LeadCarsStatus,
  LeadCarsSyncRecord,
} from './leadcars-status-panel';

const mockStatus: LeadCarsStatus = { connected: true, lastSync: '2026-05-08', message: 'OK' };
const mockFailedRecords: LeadCarsSyncRecord[] = [
  { id: 'r1', status: 'failed', errorMessage: 'Timeout', createdAt: '2026-05-08T10:00:00' },
];

describe('LeadCarsStatusPanelComponent', () => {
  let fixture: ComponentFixture<LeadCarsStatusPanelComponent>;
  let component: LeadCarsStatusPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadCarsStatusPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadCarsStatusPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loading=true shows skeleton, not content', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const skeleton = fixture.nativeElement.querySelector('.leadcars-panel__skeleton');
    const banner = fixture.nativeElement.querySelector('.leadcars-panel__status-banner');

    expect(skeleton).toBeTruthy();
    expect(banner).toBeNull();
  });

  it('skeleton elements have aria-hidden="true" via host binding', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const skeletonBlocks = fixture.nativeElement.querySelectorAll('guiders-skeleton-block');
    skeletonBlocks.forEach((block: Element) => {
      expect(block.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('loading=false and null status shows empty state', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('status', null);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.leadcars-panel__empty');
    expect(empty).toBeTruthy();
  });

  it('status provided shows status banner', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('status', mockStatus);
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.leadcars-panel__status-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Conectado');
  });

  it('failedRecords shows records list with retry button', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('status', mockStatus);
    fixture.componentRef.setInput('failedRecords', mockFailedRecords);
    fixture.detectChanges();

    const records = fixture.nativeElement.querySelectorAll('.leadcars-panel__record');
    expect(records.length).toBe(1);
  });

  it('retryAll output emits on button click', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('status', mockStatus);
    fixture.componentRef.setInput('failedRecords', mockFailedRecords);
    fixture.detectChanges();

    let emitted = false;
    component.retryAll.subscribe(() => (emitted = true));

    const btn = fixture.nativeElement.querySelector('.leadcars-panel__retry-all');
    btn?.click();

    expect(emitted).toBeTruthy();
  });
});
