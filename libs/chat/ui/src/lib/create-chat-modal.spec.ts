import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateChatModal } from './create-chat-modal';

describe('CreateChatModal', () => {
  let component: CreateChatModal;
  let fixture: ComponentFixture<CreateChatModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateChatModal],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateChatModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
