 /*import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';


@Component({
  selector: 'app-layout-pasos',
  templateUrl: './layout-pasos.component.html',
  styleUrls: ['./layout-pasos.component.css'],
  animations: [
    trigger('menuCollapsed', [
      state('expand', style({width: 'visibility: hidden'})),
      state('collapsed', style({width: '100%'})),
      transition('expand <=> collapsed', animate('200ms'))
    ])
  ]
})
export class LayoutPasosComponent implements OnInit {

  currentStep: number = 0;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const childRoute = this.route.firstChild;
      if (childRoute) {
        childRoute.url.subscribe(urlSegments => {
          this.currentStep = Number.parseInt(urlSegments[0]?.path);


        });
      }
    });
   }

  ngOnInit(): void {
    
  }

  isCollapsed = false;

}*/




import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

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
  isPaso3: boolean = false; // Nueva variable para manejar el estado de paso3
  isCollapsed = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const url = this.router.url;
      const lastSegment = url.split('/').pop();
      this.currentStep = Number.parseInt(lastSegment ?? '0', 10);
      // Actualiza isPaso3 basándote en currentStep
      this.isPaso3 = this.currentStep === 3;

      // Depuración
      console.log('Current URL:', url);
      console.log('Last Segment:', lastSegment);
      console.log('Current Step:', this.currentStep);
      console.log('Is Paso3:', this.isPaso3);
    });
  }

  ngOnInit(): void {
    // Inicialización si es necesario
  }
} 


  
