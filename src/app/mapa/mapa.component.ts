import { Component, AfterViewInit } from '@angular/core';
import { Location } from '@angular/common';

declare var google: any;

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements AfterViewInit {

  constructor(private location: Location) { }

  ngAfterViewInit() {
    const mapElement = document.getElementById('map');
    const userPosition = localStorage.getItem('userPosition');

    let latitude = -31.53;
    let longitude = -68.51;
    if(userPosition) {
      const position = JSON.parse(userPosition);
      latitude = position.latitude;
      longitude = position.longitude;
    }
    
    if (mapElement !== null) {
      const map = new google.maps.Map(mapElement, {
        zoom: 13,
        center: { lat: latitude, lng: longitude  }, 
        mapTypeId: 'satellite',
        disableDefaultUI: true
      });

      /* const marker = new google.maps.Marker({
        map: map,
        position: { lat: latitude, lng: longitude  },
        title: "San Juan, Argentina"
      }); */
    } else {
      console.error("No se encontró el elemento 'map'");
    }
  }

  goBack(): void {
    this.location.back();
  }
}

