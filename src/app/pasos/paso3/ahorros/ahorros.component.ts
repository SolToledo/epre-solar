import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-ahorros',
  templateUrl: './ahorros.component.html',
  styleUrls: ['./ahorros.component.css'],
})
export class AhorrosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  ahorrosUsdInitial: number = 0;
  ahorrosUsd: number = 0;
  panelsCountInitial: number = 0;
  panelsCountSelected: number = 0;
  panelCapacityWInitial: number = 0;
  panelCapacityW: number = 0;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sharedService.ahorroAnualUsdPromedio$
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

  this.sharedService.panelsCountSelected$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe({
      next: (newPanelsCountSelected) => {
        if (this.panelsCountInitial === 0) {
          this.panelsCountInitial = newPanelsCountSelected;
        }
        this.panelsCountSelected = newPanelsCountSelected;
        this.updateAhorro();
        this.cdr.detectChanges();
      },
    });

  this.sharedService.panelCapacityW$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe({
      next: (newPanelCapacity) => {
        if (this.panelCapacityWInitial === 0) {
          this.panelCapacityWInitial = newPanelCapacity;
        }
        this.panelCapacityW = newPanelCapacity;
        this.updateAhorro();
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateAhorro() {
    if (this.panelsCountSelected > 0 && this.panelCapacityW > 0 && this.panelsCountInitial > 0 && this.panelCapacityWInitial > 0) {
      const newAhorroValue =
        (this.panelsCountSelected * this.panelCapacityW * this.ahorrosUsdInitial) /
        (this.panelsCountInitial * this.panelCapacityWInitial);
  
      // Convertimos el valor calculado a un número entero
      const roundedAhorroValue = parseInt(newAhorroValue.toFixed(0));
  
      // Solo actualizamos si el nuevo valor es diferente del actual
      if (roundedAhorroValue !== this.sharedService.getAhorroAnualUsdPromedio()) {
        this.sharedService.setAhorroAnualUsdPromedio(roundedAhorroValue);
      }
    }
  }
}
