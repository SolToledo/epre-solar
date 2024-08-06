import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapService } from 'src/app/services/map.service';

@Component({
  selector: 'app-superficie',
  templateUrl: './superficie.component.html',
  styleUrls: ['./superficie.component.css']
})
export class SuperficieComponent implements OnInit, OnDestroy {
  selectedAreaM2!: number;
  private areaSubscription!: Subscription;
  
  constructor(private mapService: MapService) {
  }
  
  ngOnInit() {
    this.areaSubscription = this.mapService.area$().subscribe({
      next: (value) => this.selectedAreaM2 = value
    });
    
    const initialArea = this.mapService.getPolygonArea();
    if (initialArea !== null) {
      this.selectedAreaM2 = initialArea;
    }
  }

  ngOnDestroy() {
    if (this.areaSubscription) {
      this.areaSubscription.unsubscribe();
    }
  }
}
