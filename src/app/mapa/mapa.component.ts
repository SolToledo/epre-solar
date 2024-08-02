import { Component, AfterViewInit } from '@angular/core';
import { Location } from '@angular/common';
import { GoogleMapsService } from '../services/google-maps.service';

declare var google: any;

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css'],
})
export class MapaComponent implements AfterViewInit {
  constructor(
    private location: Location,
    private googleMapsService: GoogleMapsService
  ) {}

  ngAfterViewInit(): void {
   
  }
 
  goBack(): void {
    this.location.back();
  }
}
