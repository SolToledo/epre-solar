import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { skip, Subscription } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-energia',
  templateUrl: './energia.component.html',
  styleUrls: ['./energia.component.css'],
})
export class EnergiaComponent implements OnInit, AfterViewInit {
  @Input() yearlyEnergyAcKwh: any;
  panelCapacityW: number = 400;
  panelsCountSelected: any = 0;

  private panelsCountSelectedSubscription!: Subscription;
  private panelCapacitySubscription!: Subscription;

  private initialYearlyEnergyAcKwh: number = 0;
  private initialPanelsCount: number = 0; 
  potenciaInstalacionInitialW!: number;

  constructor(private sharedService: SharedService, private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.initialYearlyEnergyAcKwh = this.yearlyEnergyAcKwh;
    this.panelCapacityW = this.sharedService.getPanelCapacityW(); 
    this.panelsCountSelected = this.sharedService.getPanelsSelected(); 
    this.initialPanelsCount = this.panelsCountSelected;
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {

    // Suscribirse a los cambios en la cantidad de paneles seleccionados
    this.panelsCountSelectedSubscription =
      this.sharedService.panelsCountSelected$.pipe(skip(1)).subscribe({
        next: (count) => {
          this.panelsCountSelected = count;
          this.updateYearlyEnergy();
        },
      });

    // Suscribirse a los cambios en la capacidad del panel
    this.panelCapacitySubscription =
      this.sharedService.panelCapacityW$.pipe(skip(1)).subscribe({
        next: (capacity) => {
          this.panelCapacityW = capacity;
          this.updateYearlyEnergy();
        },
      });

      
      this.potenciaInstalacionInitialW = this.sharedService.getPotenciaInstalacionW();
  }

  ngOnDestroy(): void {
    if (this.panelsCountSelectedSubscription) {
      this.panelsCountSelectedSubscription.unsubscribe();
    }
    if (this.panelCapacitySubscription) {
      this.panelCapacitySubscription.unsubscribe();
    }
  }

  private updateYearlyEnergy(): void {
    // Obtenemos los valores iniciales en vatios
    const yearlyEnergyInitialW = this.initialYearlyEnergyAcKwh * 1000;
    const potenciaInstalacionInitialW = this.potenciaInstalacionInitialW;
  
    // Obtenemos la nueva potencia de instalación
    const newPotenciaW = this.sharedService.getPotenciaInstalacionW();
  
    // Validación para evitar divisiones por cero o valores inválidos
    if (potenciaInstalacionInitialW > 0) {
      // Calculamos la energía anual basada en la nueva potencia
      const yearlyEnergyActualW = (newPotenciaW * yearlyEnergyInitialW) / potenciaInstalacionInitialW;
      
      // Convertimos la energía anual de vatios a kilovatios-hora
      this.yearlyEnergyAcKwh = yearlyEnergyActualW / 1000;
  
      // Actualizamos el valor redondeado en el sharedService
      this.sharedService.setYearlyEnergyAcKwh(Math.round(this.yearlyEnergyAcKwh));
    } else {
      console.error('Error: La potencia de instalación inicial no puede ser 0 o un valor inválido.');
    }
  }
  
}
