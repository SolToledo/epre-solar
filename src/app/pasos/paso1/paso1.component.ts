/// <reference types="google.maps" />

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SolarApiService } from 'src/app/services/solar-api.service';

declare var google: any;
@Component({
  selector: 'app-paso1',
  templateUrl: './paso1.component.html',
  styleUrls: ['./paso1.component.css'],
})
export class Paso1Component implements OnInit {
  currentStep: number = 1;
  map: any;
  marker: any;
  drawingManager: google.maps.drawing.DrawingManager | undefined;
  overlays: google.maps.Polygon[] = [];
  areaMarked: boolean = false;
  
  constructor(
    private router: Router,
    private solarApiService: SolarApiService
  ) {}

  ngOnInit(): void {
    this.loadGoogleMaps(() => {
      this.initMap();
    });
  }

  loadGoogleMaps(callback: () => void): void {
    if (typeof google !== 'undefined' && google.maps) {
      callback();
    } else {
      window['initMap'] = () => {
        callback();
      };
      const script = document.createElement('script');
      script.src =
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyA96BDNGNezoM13_Z0FnE3hcDjiOudMKRQ&libraries=drawing,places&callback=initMap';
      document.body.appendChild(script);
    }
  }

  initMap(): void {
    const userPosition = JSON.parse(
      localStorage.getItem('userPosition') || '{}'
    );
    const { latitude, longitude } =  {
      latitude: -31.510673,
      longitude: -68.4760306,
    }; // todo: agregar userPosition || 

    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: latitude, lng: longitude },
      zoom: 15,
      mapTypeId: 'satellite',
      disableDefaultUI: true,
    });

    this.marker = new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: this.map,
      draggable: true,
    });

    const input = document.getElementById('pac-input') as HTMLInputElement;
    const searchBox = new google.maps.places.SearchBox(input);

    this.map.addListener('bounds_changed', () => {
      searchBox.setBounds(this.map.getBounds() as google.maps.LatLngBounds);
    });

    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (places.length == 0) {
        return;
      }

      // Clear out the old markers.
      if (this.marker) {
        this.marker.setMap(null);
      }

      // For each place, get the icon, name and location.
      const bounds = new google.maps.LatLngBounds();
      places.forEach((place: google.maps.places.PlaceResult) => {
        if (!place.geometry || !place.geometry.location) {
          console.log('Returned place contains no geometry');
          return;
        }

        this.marker = new google.maps.Marker({
          map: this.map,
          title: place.name,
          position: place.geometry.location,
          draggable: true,
        });

        if (place.geometry.viewport) {
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      this.map.fitBounds(bounds);
    });
    
    this.initDrawingManager();
  }

  initDrawingManager(): void {
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        editable: true,
      },
    });
    this.drawingManager?.setMap(this.map);
    google.maps.event.addListener(this.drawingManager, "drawingmode_changed", () => {
      
      const drawingMode = this.drawingManager?.getDrawingMode();
      if (drawingMode) {
        console.log("ha comenzado a dibujar")
        if(this.overlays.length > 0) {
          alert("Por favor, antes borre la selección anterior.");
          return;
        }
      }else {
        console.log("ha cambiado ", drawingMode);
        
      }
    })
    

    google.maps.event.addListener(
      this.drawingManager,
      'overlaycomplete',
      (event: any) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          this.overlays.push(event.overlay);
          if(this.overlays.length > 1) {
            alert("Por favor, antes borre la selección anterior.");
            return;
          }
          this.areaMarked = true;

          const polygon = event.overlay as google.maps.Polygon;
          const paths = polygon.getPaths().getArray();
          const polygonCoordinates = paths[0].getArray().map((coord) => {
            return { lat: coord.lat(), lng: coord.lng() };
          });
          this.enviarCoordenadasAlBackend(polygonCoordinates);
        }
      }
    );
  }

  enviarCoordenadasAlBackend(coordenadas: any[]): void {
    this.solarApiService.enviarCoordenadas(coordenadas).subscribe({
      next: (response: any) => {
        console.log('Datos calculados recibidos:', response);
        localStorage.setItem('solarData', JSON.stringify(response));
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  habilitarMarcado(): void {
    
    if (this.drawingManager) {
      this.drawingManager.setDrawingMode(
        google.maps.drawing.OverlayType.POLYGON
      );
      this.drawingManager.setOptions({
        drawingControl: true,
      });
    }
  }

  borrarDibujo(): void {
    this.overlays.forEach((overlay) => overlay.setMap(null));
    this.overlays = [];
    this.areaMarked = false;
    if (this.drawingManager) {
      this.drawingManager.setDrawingMode(null);
      this.drawingManager.setOptions({
        drawingControl: false,
      });
    }
  }

  buscarUbicacion(searchValue: string): void {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: searchValue },
      (results: { geometry: { location: any } }[], status: string) => {
        if (status === 'OK' && results) {
          if (this.map) {
            this.map.setCenter(results[0].geometry.location);
          }
          if (this.marker) {
            this.marker.setPosition(results[0].geometry.location);
          }
        } else {
          alert(
            'Geocode was not successful for the following reason: ' + status
          );
        }
      }
    );
  }

  goBack() {
    this.router.navigate(['/pasos/0']);
  }

  goToPaso2() {
    const position = this.marker.getPosition();
    if (position) {
      localStorage.setItem(
        'userInstallationPosition',
        JSON.stringify({
          latitude: position.lat(),
          longitude: position.lng(),
        })
      );
    }
    this.router.navigate(['/pasos/2']);
  }
}
