import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';

interface Tarifa {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-tarifa',
  templateUrl: './tarifa.component.html',
  styleUrls: ['./tarifa.component.css'],
})
export class TarifaComponent implements OnInit {
  tarifaContratada: string = '';
  @Output() isCategorySelected = new EventEmitter<boolean>(false);
  tarifas: Tarifa[] = [
    { value: 'T1-R1', viewValue: 'Pequeña Demanda Residencial (T1-R1, T1-R2 o T1-R3)' },
    { value: 'T1-G1', viewValue: 'Pequeña Demanda General (T1-G1, T1-G2 o T1-G3)' },
    { value: 'T2-SMP', viewValue: 'Mediana Demanda sin Medición de Potencia (T2-SMP)' },
    { value: 'T2-CMP', viewValue: 'Mediana Demanda con Medición de Potencia (T2-CMP)' },
    { value: 'T3-BT', viewValue: 'Grande Demanda en Baja Tensión (T3-BT)' },
    { value: 'T3-MT13.2', viewValue: 'Grande Demanda en Media Tensión (T3-MT13,2 kV)' },
    { value: 'T3-MT33', viewValue: 'Grande Demanda en Media Tensión (T3-MT 33 kV)' },
    { value: 'TRA-SD', viewValue: 'Riego Agrícola (TRA-SD)' }
  ];

  constructor(private sharedService: SharedService) {}

  ngOnInit(): void {
   this.tarifaContratada = this.sharedService.getTarifaContratada();
  }

  isOptionSelected(): boolean {
    return this.tarifaContratada !== '';
  }

  onTarifaChange(): void {
    this.sharedService.setTarifaContratada(this.tarifaContratada);
    localStorage.setItem('categoriaSeleccionada', JSON.stringify(this.tarifaContratada));
    this.isCategorySelected.emit(this.isOptionSelected());
    
  }
}


