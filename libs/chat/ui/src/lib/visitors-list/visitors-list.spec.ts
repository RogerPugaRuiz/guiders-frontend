import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitorsList } from './visitors-list';

describe('VisitorsList', () => {
  let component: VisitorsList;
  let fixture: ComponentFixture<VisitorsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorsList],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
