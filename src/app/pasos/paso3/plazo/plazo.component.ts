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
  private panelsCountSelectedSubscription!: Subscription;
  plazoRecuperoInversion: number = 0;
  plazoRecuperoInversionInicial: number = 0;
  panelsCountSelected: number = 0;

  @Input() yearlyEnergyAcKwhInitial: number = 0;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    
    this.plazoRecuperoInversionInicial =
      this.sharedService.getPlazoInversionValue();
    this.plazoRecuperoInversion = this.plazoRecuperoInversionInicial;
    this.yearlyEnergyAcKwhInitial = this.sharedService.getYearlyEnergyAcKwh();
    
    
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
      // Ajuste para reflejar la relación inversa
      this.plazoRecuperoInversion = 
        (this.plazoRecuperoInversionInicial * this.yearlyEnergyAcKwhInitial) /
        newYearlyEnergyAcKwh;
      
      this.sharedService.setPlazoInversion(this.plazoRecuperoInversion);
    } else {
      this.plazoRecuperoInversion = this.plazoRecuperoInversionInicial;
    }
    this.cdr.detectChanges(); 
  }
}
