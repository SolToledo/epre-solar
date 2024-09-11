import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-plazo',
  templateUrl: './plazo.component.html',
  styleUrls: ['./plazo.component.css'],
})
export class PlazoComponent implements OnInit, AfterViewInit, OnDestroy {
  private plazoInversionSubscription!: Subscription;
  private yearlyEnergyAcKwhSubscription!: Subscription;
  plazoRecuperoInversion: number = 0;
  plazoRecuperoInversionInicial: number = 0;
  panelsCountSelected: number = 0;

  @Input() yearlyEnergyAcKwhInitial: number = 0;
  plazoRecuperoDirecta!: number;
  @Input()
  periodoVeinteanalCasoConCapitalPropioInitial: any;
  inversionInicial: any;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    
    this.plazoRecuperoInversionInicial =
      this.sharedService.getPlazoInversionValue();
    this.plazoRecuperoInversion = this.plazoRecuperoInversionInicial;
    this.yearlyEnergyAcKwhInitial = this.sharedService.getYearlyEnergyAcKwh();
    this.inversionInicial = this.sharedService.getCostoInstalacion();
    
  }

  ngOnInit(): void {
    // Subscripción a los cambios en plazoInversion$
    this.plazoInversionSubscription = this.sharedService.plazoInversion$.subscribe({
      next: (plazoRecupero) => {
        this.plazoRecuperoInversion = plazoRecupero;
      }
    });
    
    // Subscripción a los cambios en yearlyEnergyAcKwh$
    this.yearlyEnergyAcKwhSubscription = this.sharedService.yearlyEnergyAcKwh$.subscribe({
      next: (newYearlyEnergyAcKwh) => {
        this.updatePlazoRecuperoInversion(newYearlyEnergyAcKwh);
      }
    });

    this.panelsCountSelected =  this.sharedService.getPanelsSelected();
    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.plazoInversionSubscription) {
      this.plazoInversionSubscription.unsubscribe();
    }
    if (this.yearlyEnergyAcKwhSubscription) {
      this.yearlyEnergyAcKwhSubscription.unsubscribe();
    }
  }

  private updatePlazoRecuperoInversion(newYearlyEnergyAcKwh: number): void {
    if (newYearlyEnergyAcKwh > 0) {
      const casoConCapitalPropioInitial = this.periodoVeinteanalCasoConCapitalPropioInitial;
      const inversionInicial = this.inversionInicial;
      const inversionActual = this.sharedService.getCostoInstalacion();
      this.plazoRecuperoInversion = this.recalculateCaso(casoConCapitalPropioInitial, this.yearlyEnergyAcKwhInitial, newYearlyEnergyAcKwh, inversionInicial, inversionActual);
      
      this.sharedService.setPlazoInversion(this.plazoRecuperoInversion);
    } else {
      this.plazoRecuperoInversion = this.plazoRecuperoInversionInicial;
    }
    this.cdr.detectChanges(); 
  }
  private recalculateCaso(
    casoConCapitalPropioInitial: any[], 
    yearlyEnergyAcKwhInitial: number, 
    newYearlyEnergyAcKwh: number, 
    inversionInicial: any, 
    inversionActual: number
  ): number {
  
    const factorAjuste = newYearlyEnergyAcKwh / yearlyEnergyAcKwhInitial;
  
    // Clonar el array inicial para no modificar el original directamente
    const casoAjustado = JSON.parse(JSON.stringify(casoConCapitalPropioInitial));
  
    // Recalcular los valores proporcionales
    for (const yearData of casoAjustado) {
      yearData.flujoIngresos *= factorAjuste;
      yearData.flujoFondos = yearData.flujoIngresos - yearData.flujoEgresos;
      yearData.flujoAcumulado = (yearData.inversiones > 0 ? -yearData.inversiones : yearData.flujoAcumulado) + yearData.flujoFondos;
    }
  
    // Encontrar el primer año en que el flujo acumulado es positivo o cero
    let totalMeses = 0;
    for (let i = 0; i < casoAjustado.length; i++) {
      const yearData = casoAjustado[i];
      if (yearData.flujoAcumulado >= 0) {
        // Calcular meses de recupero en ese año
        const mesesDelAno = ((-casoAjustado[i - 1]?.flujoAcumulado || 0) / yearData.flujoFondos) * 12;
        totalMeses += Math.round(mesesDelAno);
        break;
      } else {
        totalMeses += 12; // Agregar 12 meses por cada año en negativo
      }
    }
  
    return totalMeses;
  }
}
