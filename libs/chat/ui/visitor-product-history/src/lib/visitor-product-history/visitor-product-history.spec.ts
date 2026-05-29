import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorProductHistoryComponent, ProductView } from './visitor-product-history';

const mockProducts: ProductView[] = [
  { id: '1', sessionId: 'sess-1', name: 'Ford Focus', url: '/ford-focus' },
  { id: '2', sessionId: 'sess-1', name: 'Toyota Yaris', url: '/toyota-yaris' },
];

describe('VisitorProductHistoryComponent', () => {
  let fixture: ComponentFixture<VisitorProductHistoryComponent>;
  let component: VisitorProductHistoryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorProductHistoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorProductHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('AC8: loading=true shows skeleton elements, not empty state', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const skeleton = fixture.nativeElement.querySelector('.product-history__skeleton');
    const empty = fixture.nativeElement.querySelector('.product-history__empty');
    const skeletonBlocks = fixture.nativeElement.querySelectorAll('lib-skeleton-block');

    expect(skeleton).toBeTruthy();
    expect(empty).toBeNull();
    expect(skeletonBlocks.length).toBe(3);
  });

  it('AC8: skeleton elements have aria-hidden="true" via host binding', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const skeletonBlocks = fixture.nativeElement.querySelectorAll('lib-skeleton-block');
    skeletonBlocks.forEach((block: Element) => {
      expect(block.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('loading=false and empty products shows empty state', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('products', []);
    fixture.detectChanges();

    const empty = fixture.nativeElement.querySelector('.product-history__empty');
    const skeleton = fixture.nativeElement.querySelector('.product-history__skeleton');

    expect(empty).toBeTruthy();
    expect(skeleton).toBeNull();
  });

  it('loading=false with products shows product list', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('products', mockProducts);
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.product-history__list');
    const items = fixture.nativeElement.querySelectorAll('.product-history__item');

    expect(list).toBeTruthy();
    expect(items.length).toBe(2);
  });

  it('hasError=true shows error state', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('hasError', true);
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.product-history__error');
    expect(error).toBeTruthy();
  });
});
