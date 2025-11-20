import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorDetailPanel } from './visitor-detail-panel';

describe('VisitorDetailPanel', () => {
  let component: VisitorDetailPanel;
  let fixture: ComponentFixture<VisitorDetailPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorDetailPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorDetailPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
