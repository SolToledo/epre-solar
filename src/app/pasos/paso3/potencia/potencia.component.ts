import { Component, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-potencia',
  templateUrl: './potencia.component.html',
  styleUrls: ['./potencia.component.css']
})
export class PotenciaComponent {

  instalacionPotencia!: number;
  
  private panelsCountSelectedSubscription!: Subscription;
  panelsCountSelected$: number = 0;

  constructor(private sharedService: SharedService) {
    this.sharedService.panelsCountSelected$.subscribe({
      next: value => this.instalacionPotencia = value * 400,
    })
  }

  ngOnInit(): void {
    this.panelsCountSelectedSubscription = this.sharedService.panelsCountSelected$.subscribe({
      next: value => this.instalacionPotencia = value * 400
    })
    
  }

  ngOnDestroy(): void {
    if (this.panelsCountSelectedSubscription) {
      this.panelsCountSelectedSubscription.unsubscribe();
    }
  }
  
}
