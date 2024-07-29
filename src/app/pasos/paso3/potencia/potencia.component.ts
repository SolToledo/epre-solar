import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-potencia',
  templateUrl: './potencia.component.html',
  styleUrls: ['./potencia.component.css']
})
export class PotenciaComponent {

  @Input()
  instalacionPotencia: number = 0;
}
