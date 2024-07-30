/// <reference types="google.maps" />

import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { driver } from 'driver.js';
import { SharedService } from 'src/app/services/shared.service';

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
  tutorialShown: boolean = false;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.loadGoogleMaps(() => {
      this.initMap();
    });

    this.sharedService.tutorialShown$.subscribe((shown) => {
      this.tutorialShown = shown;
    });
    if (!this.tutorialShown) {
      this.showTutorial();
    }
  }

  showTutorial() {
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
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
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
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
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
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
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
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
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
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
      ],
    });
    driverObj.drive();
    this.sharedService.setTutorialShown(false);
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
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: '#ffffff',
        fillOpacity: 0,
        strokeWeight: 2,
        strokeColor: '#000000',
        clickable: true,
        editable: true,
        zIndex: 1,
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
          localStorage.setItem(
            'selectedAreaM2',
            JSON.stringify({
              value: this.selectedArea,
            })
          );
          localStorage.setItem(
            'polygonCoordinates',
            JSON.stringify(polygonCoordinates)
          );
          // Apply the texture to the polygon
          this.applyTextureToPolygon(polygon);
        }
      }
    );
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

      this.router.navigate(['/pasos/2']);
    } else {
      this.snackBar.open(
        'Debe seleccionar una zona de instalación para continuar.',
        '',
        {
          duration: 2000,
          panelClass: ['custom-snackbar'],
        }
      );
    }
  }

  showTooltip(event: MouseEvent) {
    if (!this.areaMarked) {
      this.snackBar.open(
        'Debe seleccionar una zona de instalación para continuar.',
        '',
        {
          duration: 2000,
          panelClass: ['custom-snackbar'],
        }
      );
    }
  }

  hideTooltip(event: MouseEvent) {
    this.snackBar.dismiss();
  }

   applyTextureToPolygon(polygon: google.maps.Polygon): void {
    const bounds = new google.maps.LatLngBounds();
    polygon.getPath().forEach((path: google.maps.LatLng) => {
      bounds.extend(path);
    });
  
    const overlay = new google.maps.GroundOverlay(
      'assets/img/solar-panel-texture.jpeg', 
      bounds,
      {
        opacity: 0.7, 
        clickable: false,
      }
    );
  
    overlay.setMap(this.map);
    polygon.addListener('mouseover', () => {
      overlay.setOpacity(0.8);
    });
    polygon.addListener('mouseout', () => {
      overlay.setOpacity(0.6);
    });
  }

  /* applyTextureToPolygon(polygon: google.maps.Polygon): void {
      const svgNS = "http://www.w3.org/2000/svg";
      const pattern = document.createElementNS(svgNS, "pattern");
      pattern.setAttribute("id", "solarTexture");
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      pattern.setAttribute("width", "100");
      pattern.setAttribute("height", "100");
  
      const image = document.createElementNS(svgNS, "image");
      image.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "assets/img/solar-panel-texture.jpeg");
      image.setAttribute("width", "100");
      image.setAttribute("height", "100");
  
      pattern.appendChild(image);
      document.getElementById("map")?.appendChild(pattern);
  
      polygon.setOptions({
        fillColor: "url(#solarTexture)",
        fillOpacity: 0.4
      });
    } */

  /* applyTextureToPolygon(polygon: google.maps.Polygon): void {
    const overlay = new google.maps.GroundOverlay(
      'src/assets/img/solar-panel-texture.jpeg',
      this.getBoundsForPolygon(polygon),
      {
        clickable: false,
        opacity: 0.5,
        map: this.map,
      }
    );
  } */

  getBoundsForPolygon(polygon: google.maps.Polygon): google.maps.LatLngBounds {
    const bounds = new google.maps.LatLngBounds();
    polygon.getPath().forEach((coord: google.maps.LatLng) => {
      bounds.extend(coord);
    });
    return bounds;
  }
}
