import { Component, Input } from '@angular/core';
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

  panelsCountSelected: number = 0;
  panelCapacityW: number = 400;

  constructor(private sharedService: SharedService) {
    this.sharedService.panelsCountSelected$.subscribe({
      next: (value) => (this.instalacionPotencia = value * 400),
    });
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
  }

  ngOnDestroy(): void {
    if (this.panelsCountSelectedSubscription) {
      this.panelsCountSelectedSubscription.unsubscribe();
    }
    if (this.panelCapacitySubscription) {
      this.panelCapacitySubscription.unsubscribe();
    }
  }

  private updateInstalacionPotencia(): void {
    this.instalacionPotencia = this.panelsCountSelected * this.panelCapacityW;
  }
}
