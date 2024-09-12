import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { skip, Subscription } from 'rxjs';
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
  eficienciaInstalacion: number = 0.95; // todo: traer de parametros

  constructor(private sharedService: SharedService, private cdr: ChangeDetectorRef) {
    this.yearlyEnergyAckWh = this.yearlyEnergyAckWhInitial;
    this.potenciaInstalacionW = this.sharedService.getPotenciaInstalacionW();
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
  
      const newYearlyEnergykWh = this.getNewYearlyEnergykWhApi(panelsCountSelect, panelsCapacityW);
  
      if (newYearlyEnergykWh) {
        // Actualizamos el valor en el componente
        this.yearlyEnergyAckWh = newYearlyEnergykWh;
  
        // Emitimos el valor actualizado a través del SharedService
        this.sharedService.setYearlyEnergyAckWh(newYearlyEnergykWh);
  
        // Notificar a Angular que actualice la vista
        this.cdr.detectChanges();
      }
    } else {
      console.error('Error: La potencia de instalación inicial o la energía anual inicial no pueden ser 0.');
    }
  
  }
  private getNewYearlyEnergykWhApi(panelsCountSelect: number, panelsCapacityW: number): number {
    const yearlyAnualConfigurations = this.sharedService.getYearlysAnualConfigurations();
    const config = yearlyAnualConfigurations.find((config)=> config.panelsCount === panelsCountSelect);
    
    if (config) {
      // Ajustamos el cálculo según la capacidad de los paneles
      return config.yearlyEnergyDcKwh * (panelsCapacityW / 400) * this.eficienciaInstalacion;
    } else {
      console.error('No se encontró configuración para el número de paneles seleccionados');
      return 0;
    }
  }

}
