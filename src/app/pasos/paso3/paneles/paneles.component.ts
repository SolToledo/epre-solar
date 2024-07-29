import { Component, Input } from '@angular/core';
import { DimensionPanel } from 'src/app/interfaces/dimension-panel';

@Component({
  selector: 'app-paneles',
  templateUrl: './paneles.component.html',
  styleUrls: ['./paneles.component.css']
})
export class PanelesComponent {

  @Input()
  panelesCantidad: number = 0;
  @Input()
  dimensionPanel!: DimensionPanel;
  @Input()
  panelCapacityW: number = 0;
}
