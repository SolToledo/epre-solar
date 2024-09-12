import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-plazo',
  templateUrl: './plazo.component.html',
  styleUrls: ['./plazo.component.css'],
})
export class PlazoComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  plazoRecuperoInversionInitial: number = 0;
  plazoRecuperoInversion: number = 0;
  yearlyAnualInitial!: number;
  yearlyAnualkW!: number;
  inversionInitialUsd: number;

  @Input()
  periodoVeinteanalCasoConCapitalPropioInitial: any;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    this.inversionInitialUsd = this.sharedService.getInversionUsd();
  }

  ngOnInit(): void {
    this.sharedService.plazoInversion$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe({
        next: (plazoValue) => {
          // Asignamos el valor inicial si aún no está definido
          if (!this.plazoRecuperoInversionInitial) {
            this.plazoRecuperoInversionInitial = plazoValue;
          }
          this.plazoRecuperoInversion = plazoValue;
          this.checkValuesAndUpdate();
        },
      });

    this.sharedService.yearlyEnergyAckWh$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe({
        next: (yearlyValue) => {
          // Asignamos el valor inicial si aún no está definido
          if (!this.yearlyAnualInitial) {
            this.yearlyAnualInitial = yearlyValue;
          }
          this.yearlyAnualkW = yearlyValue;
          this.checkValuesAndUpdate();
        },
      });
  }

  ngAfterViewInit(): void {
    // Verifica si yearlyAnualInitial está definido después de la vista cargada
    if (!this.yearlyAnualInitial) {
      this.yearlyAnualInitial = this.sharedService.getYearlyEnergyAckWh();
    }
    if (!this.plazoRecuperoInversionInitial) {
      this.plazoRecuperoInversionInitial =
        this.sharedService.getAhorroAnualUsd();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkValuesAndUpdate() {
    if (
      this.yearlyAnualInitial > 0 &&
      this.plazoRecuperoInversionInitial > 0 &&
      this.periodoVeinteanalCasoConCapitalPropioInitial
    ) {
      this.updatePlazoRecuperoInversion();
    }
  }

  private updatePlazoRecuperoInversion(): void {
    // Determinar si es necesario recalcular todo o usar regla de tres
    const variationThreshold = 0.05; // Un 5% de variación en energía anual
    const energyDifference =
      Math.abs(this.yearlyAnualkW - this.yearlyAnualInitial) /
      this.yearlyAnualInitial;

    if (energyDifference <= variationThreshold) {
      // Regla de tres para ajustar el plazo
      this.plazoRecuperoInversion = Math.round(
        (this.plazoRecuperoInversionInitial * this.yearlyAnualInitial) /
          this.yearlyAnualkW
      );
    } else {
      // Recalcular con el flujo de ingresos ajustado
      this.plazoRecuperoInversion = this.recalculateCaso(
        this.periodoVeinteanalCasoConCapitalPropioInitial,
        this.yearlyAnualInitial,
        this.yearlyAnualkW,
      );
    }

    // Actualizar el valor en SharedService
    if (
      this.plazoRecuperoInversion !== this.sharedService.getPlazoInversionValue()
    ) {
      this.sharedService.setPlazoInversion(this.plazoRecuperoInversion);
    }
  }

  private recalculateCaso(
    casoConCapitalPropioInitial: any[],
    yearlyEnergyAcKwhInitial: number,
    newYearlyEnergyAcKwh: number,
  ): number {
    const factorAjuste = newYearlyEnergyAcKwh / yearlyEnergyAcKwhInitial;

    // Clonar el array inicial para no modificar el original directamente
    const casoAjustado = JSON.parse(
      JSON.stringify(casoConCapitalPropioInitial)
    );

    // Recalcular los valores proporcionales
    for (const yearData of casoAjustado) {
      yearData.flujoIngresos *= factorAjuste;
      yearData.flujoFondos = yearData.flujoIngresos - yearData.flujoEgresos;
      yearData.flujoAcumulado =
        (yearData.inversiones > 0
          ? -yearData.inversiones
          : yearData.flujoAcumulado) + yearData.flujoFondos;
    }

    // Encontrar el primer año en que el flujo acumulado es positivo o cero
    let totalMeses = 0;
    for (let i = 0; i < casoAjustado.length; i++) {
      const yearData = casoAjustado[i];
      if (yearData.flujoAcumulado >= 0) {
        // Calcular meses de recupero en ese año
        const mesesDelAno =
          ((-casoAjustado[i - 1]?.flujoAcumulado || 0) / yearData.flujoFondos) *
          12;
        totalMeses += Math.round(mesesDelAno);
        break;
      } else {
        totalMeses += 12; // Agregar 12 meses por cada año en negativo
      }
    }

    return totalMeses;
  }
}
