import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-ahorros',
  templateUrl: './ahorros.component.html',
  styleUrls: ['./ahorros.component.css'],
})
export class AhorrosComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ahorrosUsdInitial: number = 0;
  ahorrosUsd: number = 0;
  yearlyAnualInitial: number = 0;
  yearlyAnualkW!: number;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit: Iniciando componente AhorrosComponent');

    /*  // Combinar ambos observables
    combineLatest([
      this.sharedService.ahorroAnualUsd$,
      this.sharedService.yearlyEnergyAckWh$
    ]).pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged((prev, curr) => 
        prev[0] === curr[0] && prev[1] === curr[1]
      )
    ).subscribe(([ahorroValue, yearlyValue]) => {
      console.log('Nuevos valores recibidos:', ahorroValue, yearlyValue);

      if (this.ahorrosUsdInitial === 0) {
        console.log('ahorrosUsdInitial es 0, asignando nuevo valor inicial:', ahorroValue);
        this.ahorrosUsdInitial = ahorroValue;
      }
      this.ahorrosUsd = ahorroValue;

      if (this.yearlyAnualInitial === 0) {
        console.log('yearlyAnualInitial es 0, asignando nuevo valor inicial:', yearlyValue);
        this.yearlyAnualInitial = yearlyValue;
      }
      this.yearlyAnualkW = yearlyValue;

      this.checkValuesAndUpdate();
    }); */
    this.sharedService.ahorroAnualUsd$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ahorro) => {
        this.ahorrosUsd = ahorro;
      });
      this.cdr.detectChanges()
  }

  ngAfterViewInit(): void {
    /* console.log('ngAfterViewInit: Verificando valores iniciales después de cargar la vista.');

    if (!this.yearlyAnualInitial) {
      console.log('yearlyAnualInitial no definido, obteniendo desde sharedService.');
      this.yearlyAnualInitial = this.sharedService.getYearlyEnergyAckWh();
    }
    console.log('yearlyAnualInitial después de cargar la vista:', this.yearlyAnualInitial);

    if (!this.ahorrosUsdInitial) {
      console.log('ahorrosUsdInitial no definido, obteniendo desde sharedService.');
      this.ahorrosUsdInitial = this.sharedService.getAhorroAnualUsd();
    }
    console.log('ahorrosUsdInitial después de cargar la vista:', this.ahorrosUsdInitial); */
  }

  ngOnDestroy(): void {
     console.log('ngOnDestroy: Destruyendo componente y limpiando suscripciones.');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* private updateAhorro() {
    console.log('updateAhorro: Iniciando actualización de ahorro.');
    console.log(
      'Valores actuales - yearlyAnualInitial:',
      this.yearlyAnualInitial,
      'ahorrosUsdInitial:',
      this.ahorrosUsdInitial
    );

    if (this.yearlyAnualInitial > 0 && this.ahorrosUsdInitial > 0) {
      const newAhorroValue =
        (this.yearlyAnualkW * this.ahorrosUsdInitial) / this.yearlyAnualInitial;

      const roundedAhorroValue = Math.round(newAhorroValue);
      console.log('Nuevo valor de ahorro calculado:', roundedAhorroValue);

      // Solo actualizamos si el valor ha cambiado
      const currentAhorro = this.sharedService.getAhorroAnualUsd();
      if (roundedAhorroValue !== currentAhorro) {
        console.log(
          'El valor de ahorro ha cambiado. Actualizando sharedService con:',
          roundedAhorroValue
        );
        this.sharedService.setAhorroAnualUsd(roundedAhorroValue);
      } else {
        console.log('El valor de ahorro no ha cambiado:', currentAhorro);
      }
    } else {
      console.error(
        'Error: Los valores iniciales de ahorro o energía anual no pueden ser 0 o indefinidos. yearlyAnualInitial:',
        this.yearlyAnualInitial,
        'ahorrosUsdInitial:',
        this.ahorrosUsdInitial
      );
    }
  } */

  /* private checkValuesAndUpdate(): void {
    console.log(
      'checkValuesAndUpdate: Verificando si los valores iniciales están correctamente establecidos.'
    );
    if (this.yearlyAnualInitial > 0 && this.ahorrosUsdInitial > 0) {
      console.log('Valores iniciales correctos, llamando a updateAhorro.');
      console.log(
        'this.yearlyAnualInitial > 0 && this.ahorrosUsdInitial ',
        this.yearlyAnualInitial,
        this.ahorrosUsdInitial
      );

      this.updateAhorro();
    } else {
      console.log('Valores iniciales no definidos o incorrectos.');
      console.log(
        'this.yearlyAnualInitial > 0 && this.ahorrosUsdInitial ',
        this.yearlyAnualInitial,
        this.ahorrosUsdInitial
      );
    }
  } */
}
