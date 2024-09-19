import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-energia',
  templateUrl: './energia.component.html',
  styleUrls: ['./energia.component.css'],
})
export class EnergiaComponent implements OnInit, OnDestroy {
  @Input() yearlyEnergyAckWhInitial!: number;
  private yearlyEnergyAckWh!: number;

  private potenciaOriginalW!: number;
  private destroy$ = new Subject<void>();

  constructor(private sharedService: SharedService, private cdr: ChangeDetectorRef ) {}

  ngOnInit(): void {
    this.yearlyEnergyAckWh = this.yearlyEnergyAckWhInitial;
    

    
  }

  ngAfterViewInit(): void {
    this.sharedService.potenciaInstalacionW$
    .pipe(takeUntil(this.destroy$))
    .subscribe(potencia => {
      this.updateYearlyEnergy(potencia);
    });
    this.cdr.detectChanges();
    this.potenciaOriginalW = this.sharedService.getPotenciaInstalacionW();
    
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateYearlyEnergy(nuevaPotenciaW: number): void {
    if (nuevaPotenciaW > 0 && this.yearlyEnergyAckWhInitial > 0 && this.potenciaOriginalW > 0) {
      const ratio = nuevaPotenciaW / this.potenciaOriginalW;
      this.yearlyEnergyAckWh = this.yearlyEnergyAckWhInitial * ratio * (this.sharedService.getPanelCapacityW() / 400) * 0.95;
      this.sharedService.setYearlyEnergyAckWh(this.yearlyEnergyAckWh);
    } else {
      console.error('Error: La potencia de instalación o la energía anual inicial no pueden ser 0.');
    }
  }

  get currentYearlyEnergy(): number {
    return this.yearlyEnergyAckWh;
  }
}