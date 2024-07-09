import { Component } from '@angular/core';


interface Tarifa {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-tarifa',
  templateUrl: './tarifa.component.html',
  styleUrls: ['./tarifa.component.css']
})
export class TarifaComponent {

  tarifas: Tarifa[] = [
    {value: 'recidencial', viewValue: 'Residencial'},
    {value: 'opcion1', viewValue: 'T1-R1'},
    {value: 'opcion2', viewValue: 'T1-R2'},
    {value: 'opcion3', viewValue: 'T1-R3'},
  ];

  selectedTarifa = this.tarifas[0].value;


}

