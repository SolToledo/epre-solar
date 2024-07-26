/// <reference types="google.maps" />

import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { driver } from 'driver.js';
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
  selectedArea: number = 0;

  constructor(
    private router: Router,
    private solarApiService: SolarApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadGoogleMaps(() => {
      this.initMap();
    });
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#sub-titulo',
          popover: {
            title: 'Información importante',
            description:
              'Lugar donde se instalarían los paneles fotovoltaicos.Seleccionar el lugar donde estará ubicada la instalación.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#pac-input',
          popover: {
            title: 'Ubicación',
            description:
              'Debe indicarse el lugar donde se planea instalar los paneles fotovoltaicos. Puede buscar la dirección del lugar, o seleccionar en el mapa.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#marcar',
          popover: {
            title: 'Selección manual de la ubicación',
            description:
              'Presione para activar el selector de ubicación en el mapa. Puede marcar y ajustar los vértices del lugar donde se instalarían los paneles fotovoltaicos.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#borrar',
          popover: {
            title: 'Selección manual de la ubicación',
            description:
              'Presione para borrar la selección y realizar una nueva.',
            side: 'right',
            align: 'end',
          },
        },
        {
          element: '#boton-siguiente',
          popover: {
            title: 'Advertencia',
            description:
              'Para poder continuar al siguiente paso, debe tener seleccionada una zona de instalación.',
            side: 'left',
            align: 'start',
          },
        },
      ],
    });
    driverObj.drive();
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
        'https://maps.googleapis.com/maps/api/js?key=AIzaS yA96BDNGNezoM13_Z0FnE3hcDjiOudMKRQ&libraries=drawing,places&callback=initMap';
      document.body.appendChild(script);
    }
  }

  initMap(): void {
    const userPosition = JSON.parse(
      localStorage.getItem('userPosition') || '{}'
    );
    const { latitude, longitude } = {
      latitude: -31.53,
      longitude: -68.51,
    };

    this.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: latitude, lng: longitude },
      zoom: 14,
      mapTypeId: 'satellite',
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
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

      if (this.marker) {
        this.marker.setMap(null);
      }

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
        position: google.maps.ControlPosition.TOP_LEFT,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        editable: true,
      },
    });
    this.drawingManager?.setMap(this.map);
    google.maps.event.addListener(
      this.drawingManager,
      'drawingmode_changed',
      () => {
        const drawingMode = this.drawingManager?.getDrawingMode();
        if (drawingMode) {
          if (this.overlays.length > 0) {
            alert('Por favor, antes borre la selección anterior.');
            return;
          }
        }
      }
    );

    google.maps.event.addListener(
      this.drawingManager,
      'overlaycomplete',
      (event: any) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          this.overlays.push(event.overlay);
          if (this.overlays.length > 1) {
            alert('Por favor, antes borre la selección anterior.');
            return;
          }
          this.areaMarked = true;

          const polygon = event.overlay as google.maps.Polygon;
          const paths = polygon.getPaths().getArray();
          const polygonCoordinates = paths[0].getArray().map((coord) => {
            return { lat: coord.lat(), lng: coord.lng() };
          });
          this.selectedArea = google.maps.geometry.spherical.computeArea(
            polygon.getPath()
          );
          // this.enviarCoordenadasAlBackend(polygonCoordinates);
          localStorage.setItem("polygonCoordinates", JSON.stringify(polygonCoordinates));
        }
      }
    );
  }

  enviarCoordenadasAlBackend(coordenadas: any[]): void {
    this.solarApiService.enviarCoordenadas(coordenadas).subscribe({
      next: (response: any) => {
        localStorage.setItem('solarData', JSON.stringify(response));
      },
      error: (error) => {
        console.error(error);
      },
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
          selectedAreaM2: this.selectedArea,
        })
      );
      this.router.navigate(['/pasos/2']);
    } else {
      this.snackBar.open('Debe seleccionar una zona de instalación para continuar.', '', {
        duration: 2000,
        panelClass: ['custom-snackbar']
      });
    }
  }

  showTooltip(event: MouseEvent) {
    if (!this.areaMarked) {
      this.snackBar.open('Debe seleccionar una zona de instalación para continuar.', '', {
        duration: 2000,
        panelClass: ['custom-snackbar']
      });
    }
  }

  hideTooltip(event: MouseEvent) {
    this.snackBar.dismiss();
  }
}
