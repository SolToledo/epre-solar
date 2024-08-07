import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSlider } from '@angular/material/slider';
import { Subscription } from 'rxjs';
import { DimensionPanel } from 'src/app/interfaces/dimension-panel';
import { MapService } from 'src/app/services/map.service';

@Component({
  selector: 'app-paneles',
  templateUrl: './paneles.component.html',
  styleUrls: ['./paneles.component.css'],
})
export class PanelesComponent implements OnInit, OnDestroy {
  @Input()
  panelesCantidad: number = 0;
  @Input()
  dimensionPanel!: DimensionPanel;
  @Input()
  panelCapacityW: number = 0;
  @ViewChild(MatSlider) slider!: MatSlider;
  private panelsCountSubscription!: Subscription;
  maxPanelsCount: number = 0;

  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    this.panelsCountSubscription = this.mapService
      .overlayMaxPanelsPerSuperfice$()
      .subscribe({
        next: (value) => {
          this.maxPanelsCount = value;
          if (this.panelesCantidad > this.maxPanelsCount) {
            this.panelesCantidad = this.maxPanelsCount;
          }
        },
      });

    // Obtener el valor inicial si ya está disponible
    this.maxPanelsCount = this.mapService.getPanelsCount();
    if (this.panelesCantidad > this.maxPanelsCount) {
      this.panelesCantidad = this.maxPanelsCount;
    }
  }
  ngOnDestroy(): void {
    if (this.panelsCountSubscription) {
      this.panelsCountSubscription.unsubscribe();
    }
  }

  onSliderChange(event: any) {
    this.panelesCantidad = event.value;
  }

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }
    return `${value}`;
  }
}
