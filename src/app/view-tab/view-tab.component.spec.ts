import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTabComponent } from './view-tab.component';

describe('ViewTabComponent', () => {
  let component: ViewTabComponent;
  let fixture: ComponentFixture<ViewTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
