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
    this.googleMapsService
      .loadGoogleMaps()
      .then(() => {
        this.initMap();
      })
      .catch((error) => {
        console.error('Google Maps no está disponible.', error);
      });
  }

  private initMap(): void {
    const map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: -31.53, lng: -68.51 },
      zoom: 14,
      mapTypeId: 'satellite',
      disableDefaultUI: true,
    });
  }
  goBack(): void {
    this.location.back();
  }
}
