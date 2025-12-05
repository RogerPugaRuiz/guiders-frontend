import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WhiteLabelConfig } from './white-label-config';

describe('WhiteLabelConfig', () => {
  let component: WhiteLabelConfig;
  let fixture: ComponentFixture<WhiteLabelConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhiteLabelConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(WhiteLabelConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
