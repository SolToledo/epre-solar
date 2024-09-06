import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-superficie',
  templateUrl: './superficie.component.html',
  styleUrls: ['./superficie.component.css']
})
export class SuperficieComponent implements OnInit, OnDestroy {
  selectedAreaM2!: number;
  areaPanelsSelected!: number;
  private areaSubscription!: Subscription;
  
  constructor(private mapService: MapService, private sharedService: SharedService) {
  }
  
  ngOnInit() {
    this.areaSubscription = this.mapService.area$.subscribe({
      next: (value) => this.selectedAreaM2 = value
    });

    this.sharedService.areaPanelsSelected$.subscribe({
      next: area => this.areaPanelsSelected = area
    })
    
  }

  ngOnDestroy() {
    if (this.areaSubscription) {
      this.areaSubscription.unsubscribe();
    }
  }
}
