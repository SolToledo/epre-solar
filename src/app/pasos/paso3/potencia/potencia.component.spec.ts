import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PotenciaComponent } from './potencia.component';

describe('PotenciaComponent', () => {
  let component: PotenciaComponent;
  let fixture: ComponentFixture<PotenciaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PotenciaComponent]
    });
    fixture = TestBed.createComponent(PotenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
