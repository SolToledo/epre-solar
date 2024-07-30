import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { MatSlider, MatSliderModule } from '@angular/material/slider';
import { DimensionPanel } from 'src/app/interfaces/dimension-panel';

@Component({
  selector: 'app-paneles',
  templateUrl: './paneles.component.html',
  styleUrls: ['./paneles.component.css'],
})
export class PanelesComponent implements AfterViewInit {
  @Input()
  panelesCantidad: number = 0;
  @Input()
  dimensionPanel!: DimensionPanel;
  @Input()
  panelCapacityW: number = 0;
  @ViewChild(MatSlider) slider!: MatSlider;

  onSliderChange(event: any) {
    const thumb = this.slider._input;
    if (thumb) {
      this.panelesCantidad = thumb.value;
    }
  }
  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
  }
  ngAfterViewInit() {
    
  }
}
