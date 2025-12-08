import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WhiteLabelConfigComponent } from './white-label-config';

describe('WhiteLabelConfigComponent', () => {
  let component: WhiteLabelConfigComponent;
  let fixture: ComponentFixture<WhiteLabelConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhiteLabelConfigComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WhiteLabelConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
