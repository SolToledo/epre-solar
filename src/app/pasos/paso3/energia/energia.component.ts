import { Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-energia',
  templateUrl: './energia.component.html',
  styleUrls: ['./energia.component.css']
})
export class EnergiaComponent {

  @Input() yearlyEnergyAcKwh: any;
  factorGeneracion: number = 1.2; 
  private panelsCountSelectedSubscription!: Subscription;
  private panelCapacitySubscription!: Subscription;
  panelCapacityW: number = 0;
  panelsCountSelected: any = 0;

  constructor(private sharedService: SharedService) {
    
  }

  ngOnInit(): void {
    const initialPanelsCount = this.sharedService.getPanelsSelected();
    const initialPanelCapacity = this.sharedService.getPanelCapacityW();
    
    // Calcular el factorGeneracion basado en estos valores iniciales
    this.factorGeneracion = this.calculateFactorGeneracion(initialPanelsCount, initialPanelCapacity);
    console.log(initialPanelsCount, initialPanelCapacity, this.factorGeneracion)
     // Suscribirse a la cantidad de paneles seleccionados
     this.panelsCountSelectedSubscription = this.sharedService.panelsCountSelected$.subscribe({
      next: count => this.yearlyEnergyAcKwh = this.calculateEnergy(count, this.sharedService.getPanelCapacityW())
    });

    // Suscribirse a la capacidad del panel
    this.panelCapacitySubscription = this.sharedService.panelCapacityW$.subscribe({
      next: capacity => this.yearlyEnergyAcKwh = this.calculateEnergy(this.sharedService.getPanelsSelected(), capacity)
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

  private calculateEnergy(panelsCount: number, panelCapacityW: number) {
    return panelsCount * panelCapacityW ;
  }

  private calculateFactorGeneracion(panelsCount: number, panelCapacityW: number): number {
    // Lógica para calcular el factorGeneracion basado en panelsCount y panelCapacityW
    
    return panelsCount > 0 ? (panelCapacityW * 0.003) : 1.2;
  }
}
