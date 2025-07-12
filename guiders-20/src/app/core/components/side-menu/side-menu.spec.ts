import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { SideMenu } from './side-menu';

describe('SideMenu', () => {
  let component: SideMenu;
  let fixture: ComponentFixture<SideMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideMenu],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            snapshot: { params: {} }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
