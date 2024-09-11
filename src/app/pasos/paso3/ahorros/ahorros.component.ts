import { ChangeDetectorRef, Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
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
  ) { }

  ngOnInit(): void {
    this.sharedService.ahorroAnualUsd$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe({
        next: (ahorroValue) => {
          if (this.ahorrosUsdInitial === 0) {
            this.ahorrosUsdInitial = ahorroValue;
            this.ahorrosUsd = ahorroValue;
          } else {
            this.ahorrosUsd = ahorroValue;
          }
          this.updateAhorro();
          this.cdr.detectChanges();
        },
      });

    this.sharedService.yearlyEnergyAckWh$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe({
        next: (yearlyValue) => {
          if (this.yearlyAnualInitial === 0) {
            this.yearlyAnualInitial = yearlyValue;
            this.yearlyAnualkW = yearlyValue;
          } else {
            this.yearlyAnualkW = yearlyValue;
          }
          this.updateAhorro();
          this.cdr.detectChanges();
        },
      });
  }

  ngAfterViewInit(): void {
    this.yearlyAnualInitial = this.sharedService.getYearlyEnergyAckWh();

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateAhorro() {
    if (this.yearlyAnualInitial > 0) {
      const newAhorroValue = (this.yearlyAnualkW * this.ahorrosUsdInitial) / this.yearlyAnualInitial;

      const roundedAhorroValue = parseInt(newAhorroValue.toFixed(0));

      if (roundedAhorroValue !== this.sharedService.getAhorroAnualUsd()) {
        this.sharedService.setAhorroAnualUsd(roundedAhorroValue);
      }
    } else {
      console.error('Error: Los valores iniciales de ahorro o energía anual no pueden ser 0.');
    }

  }
}
