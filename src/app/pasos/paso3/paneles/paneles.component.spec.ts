import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelesComponent } from './paneles.component';

describe('PanelesComponent', () => {
  let component: PanelesComponent;
  let fixture: ComponentFixture<PanelesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PanelesComponent]
    });
    fixture = TestBed.createComponent(PanelesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
