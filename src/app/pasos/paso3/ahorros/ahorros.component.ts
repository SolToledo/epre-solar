import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { Subject } from 'rxjs';
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
  yearlyAnualInitial!: number;
  yearlyAnualkW!: number;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sharedService.ahorroAnualUsd$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe((ahorroValue) => {
      if (this.ahorrosUsdInitial === 0) {
        this.ahorrosUsdInitial = ahorroValue;
      }
      this.ahorrosUsd = ahorroValue;
      this.checkValuesAndUpdate();
    });

  this.sharedService.yearlyEnergyAckWh$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe((yearlyValue) => {
      if (this.yearlyAnualInitial === 0) {
        this.yearlyAnualInitial = yearlyValue;
      }
      this.yearlyAnualkW = yearlyValue;
      this.checkValuesAndUpdate();
    });
  }

  ngAfterViewInit(): void {
    // Verifica si yearlyAnualInitial está definido después de la vista cargada
    if (!this.yearlyAnualInitial) {
      this.yearlyAnualInitial = this.sharedService.getYearlyEnergyAckWh();
    }
    if (!this.ahorrosUsdInitial) {
      this.ahorrosUsdInitial = this.sharedService.getAhorroAnualUsd();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateAhorro() {
    if (this.yearlyAnualInitial > 0 && this.ahorrosUsdInitial > 0) {
      setTimeout(() => {
        const newAhorroValue =
          (this.yearlyAnualkW * this.ahorrosUsdInitial) / this.yearlyAnualInitial;
  
        const roundedAhorroValue = Math.round(newAhorroValue);
  
        // Solo actualizamos si el valor ha cambiado
        if (roundedAhorroValue !== this.sharedService.getAhorroAnualUsd()) {
          this.sharedService.setAhorroAnualUsd(roundedAhorroValue);
        }
      });
    } else {
      console.error(
        'Error: Los valores iniciales de ahorro o energía anual no pueden ser 0 o indefinidos.'
      );
    }
  }
  

  private checkValuesAndUpdate(): void {
    if (this.yearlyAnualInitial > 0 && this.ahorrosUsdInitial > 0) {
      this.updateAhorro();
    }
  }
}
