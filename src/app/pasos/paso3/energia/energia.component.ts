import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { skip, Subscription } from 'rxjs';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-energia',
  templateUrl: './energia.component.html',
  styleUrls: ['./energia.component.css'],
})
export class EnergiaComponent implements OnInit, AfterViewInit {
  @Input() yearlyEnergyAckWhInitial!: number;
  yearlyEnergyAckWh: number;

  private potenciaInstalacionSubscription!: Subscription;
  potenciaInstalacionW!: number;
  eficienciaInstalacion: number;

  constructor(private sharedService: SharedService, private cdr: ChangeDetectorRef, private mapService: MapService) {
    this.yearlyEnergyAckWh = this.yearlyEnergyAckWhInitial;
    this.potenciaInstalacionW = this.sharedService.getPotenciaInstalacionW();
    this.eficienciaInstalacion = this.sharedService.getEficienciaInstalacion();
  }

  ngOnInit(): void {
    this.potenciaInstalacionSubscription = this.sharedService.potenciaInstalacionW$.subscribe({
      next: (potencia) => {
        this.potenciaInstalacionW = potencia;
        this.updateYearlyEnergykW();
      },
    });
  }

  ngAfterViewInit(): void {

  }

  ngOnDestroy(): void {
    if (this.potenciaInstalacionSubscription) {
      this.potenciaInstalacionSubscription.unsubscribe();
    }
  }


  private updateYearlyEnergykW(): void {
    if (this.potenciaInstalacionW > 0 && this.yearlyEnergyAckWhInitial > 0) {
      const panelsCountSelect = this.sharedService.getPanelsSelected();
      const panelsCapacityW = this.sharedService.getPanelCapacityW();

      const newYearlyEnergyAckWh = this.getNewYearlyEnergykWhApi(panelsCountSelect, panelsCapacityW);

      if (newYearlyEnergyAckWh) {
        // Actualizamos el valor en el componente
        this.yearlyEnergyAckWh = newYearlyEnergyAckWh;

        // Emitimos el valor actualizado a través del SharedService
        this.sharedService.setYearlyEnergyAckWh(newYearlyEnergyAckWh);

        // Notificar a Angular que actualice la vista
        this.cdr.detectChanges();
      } else {
        const yearlyAnualConfigurations = this.sharedService.getYearlysAnualConfigurations();
        const config = yearlyAnualConfigurations[yearlyAnualConfigurations.length - 1];
        const maxPanelsCount = config.panelsCount;
        const maxYearlyEnergyAckWh = config.yearlyEnergyDcKwh * this.eficienciaInstalacion;
        this.yearlyEnergyAckWh = maxYearlyEnergyAckWh;
        this.sharedService.setMaxPanelsPerSuperface(maxPanelsCount);
        this.sharedService.setPanelsCountSelected(maxPanelsCount);
        this.sharedService.update();
        this.sharedService.setYearlyEnergyAckWh(maxYearlyEnergyAckWh);
        this.cdr.detectChanges();
        this.mapService.reDrawPanels(maxPanelsCount);
      }
    } else {
      console.error('Error: La potencia de instalación inicial o la energía anual inicial no pueden ser 0.');
    }

  }
  private getNewYearlyEnergykWhApi(panelsCountSelect: number, panelsCapacityW: number): number {
    const yearlyAnualConfigurations = this.sharedService.getYearlysAnualConfigurations();
    const config = yearlyAnualConfigurations.find((config) => config.panelsCount === panelsCountSelect);

    if (config) {
      // Ajustamos el cálculo según la capacidad de los paneles
      return config.yearlyEnergyDcKwh * (panelsCapacityW / 400) * this.eficienciaInstalacion;
    } else {
      console.error('No se encontró configuración para el número de paneles seleccionados se utilizan los calculados');
       // Si no encontramos una configuración exacta, interpolamos o extrapolamos
    const lastConfig = yearlyAnualConfigurations[yearlyAnualConfigurations.length - 1];
    const energyPerPanel = lastConfig.yearlyEnergyDcKwh / lastConfig.panelsCount;
    
    // Calculamos la energía para la cantidad de paneles seleccionados
    const estimatedEnergy = energyPerPanel * panelsCountSelect;
    
    // Aplicamos los ajustes de capacidad y eficiencia
    return estimatedEnergy * (panelsCapacityW / 400) * this.eficienciaInstalacion;
      
    }
  }

}
