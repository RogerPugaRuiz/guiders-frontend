import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebsocketService } from './websocket-service';

describe('WebsocketService', () => {
  let component: WebsocketService;
  let fixture: ComponentFixture<WebsocketService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebsocketService],
    }).compileComponents();

    fixture = TestBed.createComponent(WebsocketService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
