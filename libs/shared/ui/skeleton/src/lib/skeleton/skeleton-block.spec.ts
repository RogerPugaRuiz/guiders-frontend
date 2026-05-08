import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonBlockComponent } from './skeleton-block';

describe('SkeletonBlockComponent', () => {
  let fixture: ComponentFixture<SkeletonBlockComponent>;
  let component: SkeletonBlockComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonBlockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render with aria-hidden="true"', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('should apply default width 100% and height 1rem', () => {
    const block = fixture.nativeElement.querySelector('.skeleton-block') as HTMLElement;
    expect(block.style.width).toBe('100%');
    expect(block.style.height).toBe('1rem');
  });

  it('should apply custom width and height inputs', () => {
    fixture.componentRef.setInput('width', '200px');
    fixture.componentRef.setInput('height', '80px');
    fixture.detectChanges();

    const block = fixture.nativeElement.querySelector('.skeleton-block') as HTMLElement;
    expect(block.style.width).toBe('200px');
    expect(block.style.height).toBe('80px');
  });
});
