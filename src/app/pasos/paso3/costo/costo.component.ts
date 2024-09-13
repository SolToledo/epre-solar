import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-costo',
  templateUrl: './costo.component.html',
  styleUrls: ['./costo.component.css'],
})
export class CostoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  costoInstalacionInitial: number = 0;
  costoInstalacionUsd: number = 0;
  yarlyEnergykWhInitial!: number;
  yearlyEnergykWh!: number;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    
   }

  ngOnInit(): void {
    this.sharedService.costoInstalacion$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe((newCostoInstalacion) => {
      if (this.costoInstalacionInitial === 0) {
        this.costoInstalacionInitial = newCostoInstalacion;
      }
      this.costoInstalacionUsd = newCostoInstalacion;
      this.checkValuesAndUpdate();
    });

    this.sharedService.yearlyEnergyAckWh$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe((yearlyValue) => {
      if (this.yarlyEnergykWhInitial === 0) {
        this.yarlyEnergykWhInitial = yearlyValue;
      }
      this.yearlyEnergykWh = yearlyValue;
      this.checkValuesAndUpdate();
    });
  }

  ngAfterViewInit(): void {
    if (!this.yarlyEnergykWhInitial) {
      this.yarlyEnergykWhInitial = this.sharedService.getYearlyEnergyAckWh();
    }
    if (!this.costoInstalacionInitial) {
      this.costoInstalacionInitial = this.sharedService.getAhorroAnualUsd();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkValuesAndUpdate(): void {
    if (this.yarlyEnergykWhInitial > 0 && this.costoInstalacionInitial > 0) {
      this.updateCostoInstalacion();
    }
  }

  /* private updateCostoInstalacion() {
    if (this.yarlyEnergykWhInitial > 0 && this.costoInstalacionInitial > 0) {
      setTimeout(() => {
        const newCostoInstalacion =
          (this.yearlyEnergykWh * this.costoInstalacionInitial) / this.yarlyEnergykWhInitial;
  
        const roundedCostoInstalacionValue = Math.round(newCostoInstalacion);
  
        // Solo actualizamos si el valor ha cambiado
        if (roundedCostoInstalacionValue !== this.sharedService.getCostoInstalacion()) {
          this.sharedService.setCostoInstalacion(roundedCostoInstalacionValue);
        }
      });
    } else {
      console.error(
        'Error: Los valores iniciales de ahorro o energía anual no pueden ser 0 o indefinidos.'
      );
    }
  } */
  private updateCostoInstalacion() {
    if (this.yarlyEnergykWhInitial > 0 && this.costoInstalacionInitial > 0) {

      const costoUsdWp = this.sharedService.getCostoUsdWp();
      const instalacionPotenciaW = this.sharedService.getPanelCapacityW() * this.sharedService.getPanelsSelected();
      const costoEquipoDeMedicionUsd = this.sharedService.getCostoEquipoDeMedicion();
     
      this.costoInstalacionUsd =  instalacionPotenciaW * costoUsdWp + costoEquipoDeMedicionUsd;
      if (this.costoInstalacionUsd !== this.sharedService.getCostoInstalacion()) {
        this.sharedService.setCostoInstalacion(this.costoInstalacionUsd);
      }
    } else {
      console.error('Error: No se pudo actualizar el costo de instalación. Valores indefinidos.');
    }
  }
}
