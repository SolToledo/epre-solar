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
  plazoRecuperoInitial: number = 0;
  plazoRecupero: number = 0;
  yarlyEnergykWhInitial!: number;
  yearlyEnergykWh!: number;


  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
  }

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
    if (!this.plazoRecuperoInitial) {
      this.plazoRecuperoInitial = this.sharedService.getPlazoInversionValue();
    }
   
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkValuesAndUpdate(): void {
    if (this.yarlyEnergykWhInitial > 0 && this.plazoRecuperoInitial > 0) {
      this.updatePlazoRecupero();
    }
  }

  private updatePlazoRecupero() {
    if (this.yarlyEnergykWhInitial > 0 && this.plazoRecuperoInitial > 0) {
      setTimeout(() => {
        const newPlazoRecuperoValue =
          (this.yearlyEnergykWh * this.plazoRecuperoInitial) / this.yarlyEnergykWhInitial;
  
        const roundedPlazoRecuperoValue = Math.round(newPlazoRecuperoValue);
  
        // Solo actualizamos si el valor ha cambiado
        if (roundedPlazoRecuperoValue !== this.sharedService.getPlazoInversionValue()) {
          this.sharedService.setAhorroAnualUsd(roundedPlazoRecuperoValue);
        }
      });
    } else {
      console.error(
        'Error: Los valores iniciales de ahorro o energía anual no pueden ser 0 o indefinidos.'
      );
    }
  }
 
  
}
