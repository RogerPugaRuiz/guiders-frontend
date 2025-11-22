import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaveFilterDialog } from './save-filter-dialog';

describe('SaveFilterDialog', () => {
  let component: SaveFilterDialog;
  let fixture: ComponentFixture<SaveFilterDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaveFilterDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveFilterDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
