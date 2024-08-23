import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { skip, Subscription } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-energia',
  templateUrl: './energia.component.html',
  styleUrls: ['./energia.component.css'],
})
export class EnergiaComponent implements OnInit, AfterViewInit {
  @Input() yearlyEnergyAcKwh: any;
  panelCapacityW: number = 400;
  panelsCountSelected: any = 0;

  private panelsCountSelectedSubscription!: Subscription;
  private panelCapacitySubscription!: Subscription;

  private initialYearlyEnergyAcKwh: number = 0;
  private initialPanelsCount: number = 0; 

  constructor(private sharedService: SharedService, private cdr: ChangeDetectorRef) {
    
  }

  ngOnInit(): void {
    this.initialYearlyEnergyAcKwh = this.yearlyEnergyAcKwh;
    this.panelCapacityW = this.sharedService.getPanelCapacityW(); 
    this.panelsCountSelected = this.sharedService.getPanelsSelected(); 
    this.initialPanelsCount = this.panelsCountSelected;
    this.sharedService.setYearlyEnergyAcKwh(this.yearlyEnergyAcKwh);
    // this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    // Suscribirse a los cambios en la cantidad de paneles seleccionados
    this.panelsCountSelectedSubscription =
      this.sharedService.panelsCountSelected$.pipe(skip(1)).subscribe({
        next: (count) => {
          this.panelsCountSelected = count;
          this.updateYearlyEnergy();
        },
      });

    // Suscribirse a los cambios en la capacidad del panel
    this.panelCapacitySubscription =
      this.sharedService.panelCapacityW$.pipe(skip(1)).subscribe({
        next: (capacity) => {
          this.panelCapacityW = capacity;
          this.updateYearlyEnergy();
        },
      });
  }

  ngOnDestroy(): void {
    if (this.panelsCountSelectedSubscription) {
      this.panelsCountSelectedSubscription.unsubscribe();
    }
    if (this.panelCapacitySubscription) {
      this.panelCapacitySubscription.unsubscribe();
    }
  }

  // Método para actualizar yearlyEnergyAcKwh basado en la cantidad de paneles y capacidad del panel
  private updateYearlyEnergy(): void {
    this.yearlyEnergyAcKwh = 
      (this.initialYearlyEnergyAcKwh * 
      (this.panelsCountSelected / this.initialPanelsCount) * 
      (this.panelCapacityW / 400)).toFixed(0);
    this.sharedService.setYearlyEnergyAcKwh(this.yearlyEnergyAcKwh);
    // this.cdr.detectChanges();
  }
  
}
