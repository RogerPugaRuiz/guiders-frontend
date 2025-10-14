import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UnreadBadge } from './unread-badge';

describe('UnreadBadge', () => {
  let component: UnreadBadge;
  let fixture: ComponentFixture<UnreadBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnreadBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(UnreadBadge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
