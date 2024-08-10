
  import { animate, state, style, transition, trigger } from '@angular/animations';
  import { Component, OnInit } from '@angular/core';
  import { Router, NavigationEnd } from '@angular/router';
  import { filter } from 'rxjs';
import { MapService } from '../services/map.service';
  
  @Component({
    selector: 'app-layout-pasos',
    templateUrl: './layout-pasos.component.html',
    styleUrls: ['./layout-pasos.component.css'],
    animations: [
      trigger('menuCollapsed', [
        state('expand', style({ width: 'visibility: hidden' })),
        state('collapsed', style({ width: '100%' })),
        transition('expand <=> collapsed', animate('200ms'))
      ])
    ]
  })
  export class LayoutPasosComponent implements OnInit {
    currentStep: number = 0;
    isPaso3: boolean = false;
    isCollapsed = false;
  
    constructor(private router: Router, private mapService: MapService) {
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        const url = this.router.url;
        const lastSegment = url.split('/').pop();
        this.currentStep = Number.parseInt(lastSegment ?? '0', 10);
        this.isPaso3 = this.currentStep === 3;
  
        // Restablece isCollapsed cuando se navega a un nuevo paso
        this.isCollapsed = false;
        
      });
    }
  
    ngOnInit(): void {
      
    }
  
    toggleCollapse() {
      // Permitir colapsar y expandir cualquier paso
      this.isCollapsed = !this.isCollapsed;
      if (this.mapService.getPolygons().length > 0) {
        this.recenterMap();
      }
    }

    private recenterMap() {
      setTimeout(() => {
        this.mapService.recenterMapToVisibleArea();
      }, 300); 
    }
    
  }
  