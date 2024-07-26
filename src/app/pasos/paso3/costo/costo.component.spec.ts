import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostoComponent } from './costo.component';

describe('CostoComponent', () => {
  let component: CostoComponent;
  let fixture: ComponentFixture<CostoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CostoComponent]
    });
    fixture = TestBed.createComponent(CostoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
