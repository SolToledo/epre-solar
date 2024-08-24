import { Component } from '@angular/core';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-ahorros',
  templateUrl: './ahorros.component.html',
  styleUrls: ['./ahorros.component.css']
})
export class AhorrosComponent {

    ahorrosUsd: number = 0;

    constructor(private sharedService: SharedService) {

    }

    ngOnInit(): void {
      this.sharedService.ahorroAnualUsdPromedio$.subscribe({
        next: ahorro => {
          this.ahorrosUsd = parseInt(ahorro.toFixed(0));
        }
      })
      
    }
}
