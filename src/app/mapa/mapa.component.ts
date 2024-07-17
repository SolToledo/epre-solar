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

    let latitude = -31.510673;
    let longitude = -68.4760306;
    if(userPosition) {
      const position = JSON.parse(userPosition);
      latitude = position.latitude;
      longitude = position.longitude;
    }
    
    if (mapElement !== null) {
      const map = new google.maps.Map(mapElement, {
        zoom: 17,
       /* center: { lat: -31.510673, lng: -68.5560306 },*/
        center: { lat: latitude, lng: longitude  }, // Ajusta ligeramente la longitud hacia el oeste
        mapTypeId: 'satellite',
        disableDefaultUI: true
      });

      const marker = new google.maps.Marker({
        map: map,
        position: { lat: latitude, lng: longitude  },
        title: "San Juan, Argentina"
      });

      // Elimina el código relacionado con autocomplete si no estás utilizando el input.
      /*
      const inputElement = document.getElementById('pac-input');
      if (inputElement !== null) {
        const autocomplete = new google.maps.places.Autocomplete(inputElement as HTMLInputElement);
        autocomplete.bindTo('bounds', map);

        const infowindow = new google.maps.InfoWindow();
        const infowindowContent = document.createElement('div');
        infowindowContent.innerHTML = `
          <div><strong id="place-name"></strong></div>
          <div id="place-address"></div>
        `;
        infowindow.setContent(infowindowContent);

        autocomplete.addListener('place_changed', () => {
          infowindow.close();
          const place = autocomplete.getPlace();

          if (!place.geometry || !place.geometry.location) {
            window.alert("No details available for input: '" + place.name + "'");
            console.error(place);
            return;
          }

          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
          } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
          }

          marker.setPosition(place.geometry.location);

          infowindowContent.querySelector('#place-name')!.textContent = place.name!;
          infowindowContent.querySelector('#place-address')!.textContent = place.formatted_address!;
          infowindow.open(map, marker);
        });
      }
      */
    } else {
      console.error("No se encontró el elemento 'map'");
    }
  }

  goBack(): void {
    this.location.back();
  }
}

