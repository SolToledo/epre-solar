import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-costo',
  templateUrl: './costo.component.html',
  styleUrls: ['./costo.component.css'],
})
export class CostoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  costoInstalacionInitial: number;
  costoInstalacionUsd: number;
  private yearlyEnergykWhSubscription!: Subscription;
  yarlyEnergykWhInitial!: number;
  yearlyEnergykWh!: number;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    this.costoInstalacionInitial = this.sharedService.getCostoInstalacion();
    this.costoInstalacionUsd = this.costoInstalacionInitial;
    this.yarlyEnergykWhInitial = this.sharedService.getYearlyEnergyAckWh(); 
   }

  ngOnInit(): void {
    this.yearlyEnergykWhSubscription = this.sharedService.yearlyEnergyAckWh$.subscribe({
      next: (yearlyValue) => {
        this.yearlyEnergykWh = yearlyValue;
        this.updateCostoInstalacion(); 
      },
      error: (err) => console.error('Error al obtener yearlyEnergykWh:', err)
    });

  }

  ngAfterViewInit(): void {
    
  }

  ngOnDestroy(): void {
    if (this.yearlyEnergykWhSubscription) {
      this.yearlyEnergykWhSubscription.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateCostoInstalacion() {
    if (this.yearlyEnergykWh && this.yarlyEnergykWhInitial) {

      const factorDeAjuste = this.yearlyEnergykWh / this.yarlyEnergykWhInitial;
      
      // Calculamos el nuevo costo de instalación basado en el factor
      const nuevoCostoInstalacion = this.costoInstalacionInitial * factorDeAjuste;

      // Redondeamos el valor a dos decimales
      this.costoInstalacionUsd = Math.round(nuevoCostoInstalacion);

      // Emitimos el nuevo valor de costo de instalación al SharedService
      this.sharedService.setCostoInstalacion(this.costoInstalacionUsd);

      // Aplicamos ChangeDetectorRef para actualizar la vista
      this.cdr.detectChanges();
    } else {
      console.error('Error: No se pudo actualizar el costo de instalación. Valores indefinidos.');
    }
  }
}
