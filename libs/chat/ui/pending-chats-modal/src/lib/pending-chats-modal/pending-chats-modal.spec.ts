import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PendingChatsModal } from './pending-chats-modal';

describe('PendingChatsModal', () => {
  let component: PendingChatsModal;
  let fixture: ComponentFixture<PendingChatsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingChatsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(PendingChatsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
