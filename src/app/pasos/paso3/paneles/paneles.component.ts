import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSlider } from '@angular/material/slider';
import { Subscription } from 'rxjs';
import { DimensionPanel } from 'src/app/interfaces/dimension-panel';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';

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
  private plazoInversionSubscription!: Subscription;
  plazoRecuperoInversion!: number;
  plazoRecuperoInversionValorInicial: number;
  constructor(private mapService: MapService, private sharedService: SharedService) {
    this.plazoRecuperoInversionValorInicial = this.sharedService.getPlazoInversionValue();
  }

  ngOnInit(): void {
    this.maxPanelsPerAreaSubscription = this.mapService.maxPanelsPerArea$.subscribe({
      next: value => this.maxPanelsArea$ = value
    })
    this.panelesCantidad = this.maxPanelsArea$;
    this.sharedService.setPanelsCountSelected(this.panelesCantidad);

    this.plazoInversionSubscription = this.sharedService.plazoInversion$.subscribe({
      next: plazo => {
        this.plazoRecuperoInversion = plazo;
        if (this.plazoRecuperoInversion && this.maxPanelsArea$) {
          this.updatePlazoInversion(this.panelesCantidad, this.maxPanelsArea$, this.plazoRecuperoInversionValorInicial);
        }
      }
    });
  }

  updatePlazoInversion(panelesActuales: number, panelesIniciales: number, plazoInicial: number): void {
    if (panelesActuales > 0 && panelesIniciales > 0 && plazoInicial > 0) {
      const nuevoPlazo = (panelesIniciales / panelesActuales) * plazoInicial;
      this.sharedService.setPlazoInversion(nuevoPlazo);
    }else {
      console.error('Valores incorrectos para calcular el nuevo plazo');
    }
  }

  ngAfterViewInit(): void {
    this.sharedService.setPanelsCountSelected(this.panelesCantidad);
  }

  ngOnDestroy(): void {
    if (this.maxPanelsPerAreaSubscription) {
      this.maxPanelsPerAreaSubscription.unsubscribe();
    }
    if (this.plazoInversionSubscription) {
      this.plazoInversionSubscription.unsubscribe();
    }
  }

  onSliderChange() {
    if (this.panelesCantidad > this.maxPanelsArea$) {
      this.panelesCantidad = this.maxPanelsArea$; 
    }
    this.sharedService.setPanelsCountSelected(this.panelesCantidad);
    this.mapService.reDrawPanels(this.panelesCantidad);
    this.updatePlazoInversion(this.panelesCantidad, this.maxPanelsArea$, this.plazoRecuperoInversionValorInicial);
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
