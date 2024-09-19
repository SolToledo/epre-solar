import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-potencia',
  templateUrl: './potencia.component.html',
  styleUrls: ['./potencia.component.css'],
})
export class PotenciaComponent {
  instalacionPotenciakW!: number;

  private panelsCountSelectedSubscription!: Subscription;
  private panelCapacitySubscription!: Subscription;
  potenciaMaxCategoriaSubscription!: Subscription;

  panelsCountSelected: number = 0;
  panelCapacityW: number = 0;
  potenciaMaxCategoriaSelectkW: number = 0;

  constructor(private sharedService: SharedService, private cdr: ChangeDetectorRef, private mapService: MapService) {
    this.panelCapacityW = this.sharedService.getPanelCapacityW();
  }

  ngOnInit(): void {
    this.panelsCountSelectedSubscription = this.sharedService.panelsCountSelected$.subscribe({
      next: value => {
        this.panelsCountSelected = value;
        this.updateInstalacionPotencia();
      }
    });

    this.panelCapacitySubscription = this.sharedService.panelCapacityW$.subscribe({
      next: value => {
        this.panelCapacityW = value;
        this.verificarYActualizarPaneles();
      }
    });

    this.potenciaMaxCategoriaSubscription = this.sharedService.potenciaMaxAsignadaW$.subscribe({
      next: (potenciaMaxW) => {
        this.potenciaMaxCategoriaSelectkW = potenciaMaxW / 1000
        this.verificarYActualizarPaneles();
      }
    })
  }

  ngOnDestroy(): void {
    if (this.panelsCountSelectedSubscription) {
      this.panelsCountSelectedSubscription.unsubscribe();
    }
    if (this.panelCapacitySubscription) {
      this.panelCapacitySubscription.unsubscribe();
    }

    if (this.potenciaMaxCategoriaSubscription) {
      this.potenciaMaxCategoriaSubscription.unsubscribe();
    }
  }

  private updateInstalacionPotencia(): void {
    this.instalacionPotenciakW = this.panelsCountSelected * this.panelCapacityW / 1000;
    if (this.instalacionPotenciakW > this.potenciaMaxCategoriaSelectkW) {
      this.instalacionPotenciakW = this.potenciaMaxCategoriaSelectkW;
    }
    this.sharedService.setPotenciaInstalacionW(this.instalacionPotenciakW * 1000);
    this.cdr.detectChanges();
  }

  private verificarYActualizarPaneles(): void {
    const potenciaTotal = this.panelsCountSelected * this.panelCapacityW;
    
    if (potenciaTotal > this.potenciaMaxCategoriaSelectkW * 1000) {
      // Ajusta el número de paneles al máximo posible sin exceder la potencia máxima
      const maxPanels = Math.round(this.potenciaMaxCategoriaSelectkW * 1000 / this.panelCapacityW);
      this.panelsCountSelected = maxPanels;
      this.sharedService.setPanelsCountSelected(this.panelsCountSelected);
      
      this.mapService.reDrawPanels(this.panelsCountSelected);
      
    }
  
    this.updateInstalacionPotencia(); // Actualiza la potencia total
  }
}
