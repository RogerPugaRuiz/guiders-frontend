import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactDataForm } from './contact-data-form';

describe('ContactDataForm', () => {
  let component: ContactDataForm;
  let fixture: ComponentFixture<ContactDataForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactDataForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactDataForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
