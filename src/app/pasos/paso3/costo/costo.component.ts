import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
  ) {}

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

  private updateCostoInstalacion() {
    if (this.yarlyEnergykWhInitial > 0 && this.costoInstalacionInitial > 0) {
      const categoria = this.sharedService.getTarifaContratada();
      const isT1 = categoria.includes('T1');
      let costoUsdWp = this.sharedService.getCostoUsdWp() || 1.24;
      let costoEquipoDeMedicionUsd =
        this.sharedService.getCostoEquipoDeMedicion() || 646.53; 
      // Aplicar IVA (21%) si la tarifa contratada es T1
      if (isT1) {
        const iva = 0.21;
        costoUsdWp *= 1 + iva; 
        costoEquipoDeMedicionUsd *= 1 + iva; 
      }
      
      const instalacionPotenciaW =
      this.sharedService.getPanelCapacityW() *
      this.sharedService.getPanelsSelected();
      

      this.costoInstalacionUsd =
        instalacionPotenciaW * costoUsdWp + costoEquipoDeMedicionUsd;
      if (
        this.costoInstalacionUsd !== this.sharedService.getCostoInstalacion()
      ) {
        this.sharedService.setCostoInstalacion(this.costoInstalacionUsd);
      }
    } else {
      console.error(
        'Error: No se pudo actualizar el costo de instalación. Valores indefinidos.'
      );
    }
  }
}
