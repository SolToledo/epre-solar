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
  @Input() dimensionPanel!: DimensionPanel;
  @Input() panelCapacityW: number = 0;
  @ViewChild(MatSlider) slider!: MatSlider;
  private maxPanelsPerAreaSubscription!: Subscription;
  maxPanelsArea$: number = 0;
  
  panelesCantidad: number = 0;

  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    this.maxPanelsPerAreaSubscription = this.mapService.maxPanelsPerArea$.subscribe({
      next: value => this.maxPanelsArea$ = value
    })
    this.panelesCantidad = this.maxPanelsArea$;
  }

  ngOnDestroy(): void {
    if (this.maxPanelsPerAreaSubscription) {
      this.maxPanelsPerAreaSubscription.unsubscribe();
    }
  }

  onSliderChange() {
    
  }

  formatLabel(value: number): string {
    return value >= 1000 ? Math.round(value / 1000) + 'k' : `${value}`;
  }

  get totalCapacityKW(): number {
    return (this.panelCapacityW * this.panelesCantidad) / 1000;
  }

  get surfaceArea(): number {
    const panelHeight = this.dimensionPanel.height / 100;
    const panelWidth = this.dimensionPanel.width / 100;
    return panelHeight * panelWidth * this.panelesCantidad;
  }
}
