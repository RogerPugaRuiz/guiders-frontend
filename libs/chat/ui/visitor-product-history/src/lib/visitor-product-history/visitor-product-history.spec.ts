import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorProductHistory } from './visitor-product-history';

describe('VisitorProductHistory', () => {
  let component: VisitorProductHistory;
  let fixture: ComponentFixture<VisitorProductHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorProductHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorProductHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
