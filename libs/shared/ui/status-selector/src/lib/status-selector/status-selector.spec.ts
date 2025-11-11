import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusSelector } from './status-selector';

describe('StatusSelector', () => {
  let component: StatusSelector;
  let fixture: ComponentFixture<StatusSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusSelector],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
