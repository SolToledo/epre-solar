import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-plazo',
  templateUrl: './plazo.component.html',
  styleUrls: ['./plazo.component.css'],
})
export class PlazoComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  plazoRecuperoInitial: number = 0;
  plazoRecupero: number = 0;
  yearlyEnergykWhInitial!: number;
  yearlyEnergykWh!: number;
  potenciaInstalacionInitialkW!: number;
  installationCostInitial!: number;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sharedService.plazoInversion$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((newPlazoRecupero) => {
        if (this.plazoRecuperoInitial === 0) {
          this.plazoRecuperoInitial = newPlazoRecupero;
        }
        this.plazoRecupero = newPlazoRecupero;
        this.checkValuesAndUpdate();
      });
  
    this.sharedService.yearlyEnergyAckWh$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((yearlyValue) => {
        if (this.yearlyEnergykWhInitial === 0) {
          this.yearlyEnergykWhInitial = yearlyValue;
        }
        this.yearlyEnergykWh = yearlyValue;
        this.checkValuesAndUpdate();
      });
  }
  ngAfterViewInit(): void {
    if (!this.yearlyEnergykWhInitial) {
      this.yearlyEnergykWhInitial = this.sharedService.getYearlyEnergyAckWh();
    }
    if (!this.plazoRecuperoInitial) {
      this.plazoRecuperoInitial = this.sharedService.getPlazoInversionValue();
    }
    if (!this.potenciaInstalacionInitialkW) {
      this.potenciaInstalacionInitialkW =
        this.sharedService.getPotenciaInstalacionW() / 1000;
    }
    if (!this.installationCostInitial) {
        this.installationCostInitial = this.sharedService.getCostoInstalacion();
        
    }
  
    // Añadir logs para ver si los valores iniciales se están asignando
    console.log('Valores iniciales asignados:', {
      yearlyEnergykWhInitial: this.yearlyEnergykWhInitial,
      plazoRecuperoInitial: this.plazoRecuperoInitial,
      potenciaInstalacionInitialkW: this.potenciaInstalacionInitialkW,
      installationCostInitial: this.installationCostInitial,
    });
  
      this.checkValuesAndUpdate();
      
  }

  ngOnDestroy(): void {
  }

  private checkValuesAndUpdate(): void {
    if (
      this.yearlyEnergykWhInitial > 0 &&
      this.plazoRecuperoInitial > 0 &&
      this.yearlyEnergykWh > 0 &&
      this.potenciaInstalacionInitialkW > 0 &&
      this.installationCostInitial > 0 &&
      this.sharedService.getPotenciaInstalacionW() > 0 &&  // Aseguramos que todos los valores estén presentes
      this.sharedService.getCostoInstalacion() > 0
    ) {
      console.log(
        'Cálculo:',
        'yearlyEnergykWh:',
        this.yearlyEnergykWh,
        'yearlyEnergykWhInitial:',
        this.yearlyEnergykWhInitial,
        'plazoRecuperoInitial:',
        this.plazoRecuperoInitial,
        'potenciaInstalacionInitialkW:',
        this.potenciaInstalacionInitialkW,
        'currentPotenciaInstalacionW:',
        this.sharedService.getPotenciaInstalacionW(),
        'installationCostInitial:',
        this.installationCostInitial,
        'installationCostCurrent:',
        this.sharedService.getCostoInstalacion(),
      );
  
      this.updatePlazoRecupero();
    } else {
      console.warn('Valores no inicializados correctamente, no se puede calcular el plazo de recuperación.');
    }
  }

  private updatePlazoRecupero() {
    if (
      this.yearlyEnergykWhInitial > 0 &&
      this.plazoRecuperoInitial > 0 &&
      this.yearlyEnergykWh > 0 &&
      this.potenciaInstalacionInitialkW > 0 &&
      this.installationCostInitial > 0
    ) {
      setTimeout(() => {
        // Calculamos la relación entre la producción anual actual y la inicial
        const energyRatio = 1;
        // const energyRatio = this.yearlyEnergykWh / this.yearlyEnergykWhInitial;
        // Calculamos la relación entre la potencia actual y la inicial
        const potenciaAdjustment =  this.potenciaInstalacionInitialkW / (this.sharedService.getPotenciaInstalacionW() / 1000);
        // Calculamos la relación entre el costo de instalación actual y el inicial
        const installationCostAdjustment =  this.sharedService.getCostoInstalacion() / this.installationCostInitial;
        // Calculamos el nuevo plazo de recupero
        const newPlazoRecuperoValue = 
          this.plazoRecuperoInitial *
          ( energyRatio) *
          ( potenciaAdjustment) *
          installationCostAdjustment;
        console.log(
          'Cálculo:',
          'yearlyEnergykWh:',
          this.yearlyEnergykWh,
          'yearlyEnergykWhInitial:',
          this.yearlyEnergykWhInitial,
          'plazoRecuperoInitial:',
          this.plazoRecuperoInitial,
          'potenciaInstalacionInitialkW:',
          this.potenciaInstalacionInitialkW,
          'currentPotenciaInstalacionW:',
          this.sharedService.getPotenciaInstalacionW(),
          'installationCostInitial:',
          this.installationCostInitial,
          'installationCostCurrent:',
          this.sharedService.getCostoInstalacion(),
          'newPlazoRecuperoValue:',
          newPlazoRecuperoValue
        );
        const roundedPlazoRecuperoValue = Math.round(newPlazoRecuperoValue);
        // Solo actualizamos si el valor ha cambiado
        if (
          roundedPlazoRecuperoValue !==
          this.sharedService.getPlazoInversionValue()
        ) {
          this.sharedService.setPlazoInversion(roundedPlazoRecuperoValue);
        }
      });
    } else {
      console.error(
        'Error: Los valores iniciales de ahorro, energía anual, potencia instalada o costo de instalación no pueden ser 0 o indefinidos.'
      );
    }
  }
}