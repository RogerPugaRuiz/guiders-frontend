import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorProductsService } from './visitor-products-service';

describe('VisitorProductsService', () => {
  let component: VisitorProductsService;
  let fixture: ComponentFixture<VisitorProductsService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorProductsService],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorProductsService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
