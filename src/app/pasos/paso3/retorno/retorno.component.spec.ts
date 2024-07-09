import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetornoComponent } from './retorno.component';

describe('RetornoComponent', () => {
  let component: RetornoComponent;
  let fixture: ComponentFixture<RetornoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RetornoComponent]
    });
    fixture = TestBed.createComponent(RetornoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
