import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-plazo',
  templateUrl: './plazo.component.html',
  styleUrls: ['./plazo.component.css'],
})
export class PlazoComponent implements OnInit, OnDestroy {
  
  plazoRecuperoInversion: number = 0;
  private plazoInversionSubscription!: Subscription;
  
  constructor(private sharedService: SharedService) {
  }

  ngOnInit(): void {
    this.plazoInversionSubscription = this.sharedService.plazoInversion$.subscribe({
      next: (plazo) => (this.plazoRecuperoInversion = plazo),
    });
  }

  ngOnDestroy(): void {
    if (this.plazoInversionSubscription) {
      this.plazoInversionSubscription.unsubscribe();
    }
  }
}
