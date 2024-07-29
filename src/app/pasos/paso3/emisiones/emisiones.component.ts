import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-emisiones',
  templateUrl: './emisiones.component.html',
  styleUrls: ['./emisiones.component.css']
})
export class EmisionesComponent {

  @Input()
  carbonOffsetFactorTnPerMWh: number = 0;
}
