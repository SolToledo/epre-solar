import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-potencia',
  templateUrl: './potencia.component.html',
  styleUrls: ['./potencia.component.css'],
})
export class PotenciaComponent {
  instalacionPotencia!: number;

  private panelsCountSelectedSubscription!: Subscription;
  private panelCapacitySubscription!: Subscription;
  potenciaMaxCategoriaSubscription!: Subscription;

  panelsCountSelected: number = 0;
  panelCapacityW: number = 0;
  potenciaMaxCategoriaSelect: number = 0;

  constructor(private sharedService: SharedService, private cdr: ChangeDetectorRef) {
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
        this.updateInstalacionPotencia();
      }
    });

    this.potenciaMaxCategoriaSubscription = this.sharedService.potenciaMaxAsignada$.subscribe({
      next: (potenciaMax) => {
        this.potenciaMaxCategoriaSelect = potenciaMax * 1000
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
    this.instalacionPotencia = this.panelsCountSelected * this.panelCapacityW;
    if (this.instalacionPotencia > this.potenciaMaxCategoriaSelect) {
      this.instalacionPotencia = this.potenciaMaxCategoriaSelect;
    }
    this.sharedService.setPotenciaInstalacionW(this.instalacionPotencia);
    this.cdr.detectChanges();
  }
}
