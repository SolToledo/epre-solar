import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { driver } from 'driver.js';
import { LocationService } from 'src/app/services/location.service';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-paso1',
  templateUrl: './paso1.component.html',
  styleUrls: ['./paso1.component.css'],
})
export class Paso1Component implements OnInit {
  currentStep: number = 1;
  selectedArea: number = 0;
  tutorialShown: boolean = false;
  areaMarked: boolean = false;
  @ViewChild('pacInput', { static: false }) pacInput!: ElementRef;
  private marker!: google.maps.marker.AdvancedMarkerElement | null;
  private map!: google.maps.Map;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private sharedService: SharedService,
    private mapService: MapService,
    private locationService: LocationService
  ) {}

  ngOnInit(): void {
    this.sharedService.tutorialShown$.subscribe((shown) => {
      this.tutorialShown = shown;
    });

    this.mapService.overlayComplete$().subscribe((value) => {
      this.areaMarked = value;
    });

    this.mapService.clearDrawing();
    this.areaMarked = false;
    this.mapService.hideDrawingControl();
  }

  async ngAfterViewInit(): Promise<void> {
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;
    this.map = this.mapService.getMap();

    if (!this.map) {
      this.router.navigate(['/']);
      console.error('El mapa no está inicializado.');
      return;
    }
    this.map.setZoom(14);
    this.marker = new AdvancedMarkerElement({
      map: this.map,
    });

    if (this.pacInput) {
      this.initializeAutocomplete();
    } else {
      console.error('pacInput no está definido.');
    }

    if (!this.tutorialShown) {
      setTimeout(() => {
        this.showTutorial();
      }, 500);
    }

    this.mapService.initializeDrawingManager();
  }

  showTutorial() {
    const driverObj = driver({
      showProgress: false,
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
  }

  showTooltip() {
    if (!this.areaMarked) {
      const snackbarRef = this.snackBar.open(
        'Debe seleccionar una zona de instalación para continuar.',
        '',
        {
          duration: 5000,
          panelClass: ['custom-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
    }
  }

  async buscarUbicacion(value: string) {
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker'
    )) as google.maps.MarkerLibrary;
    this.map = this.mapService.getMap();
    if (!this.marker) {
      this.marker = new AdvancedMarkerElement({
        map: this.map,
      });
    }
    try {
      console.log(value);
      
      const location = await this.locationService.validateLocation(
        value,
        this.map,
        this.marker
      );

      if (location) {
        // Si la ubicación es válida, actualiza o crea el marcador
        if (!this.marker) {
          // Si no existe un marcador, crea uno
          this.marker = new google.maps.marker.AdvancedMarkerElement({
            position: location,
            map: this.map,
          });
        } else {
          // Si ya existe un marcador, actualiza su posición
          this.marker.position = location;
          this.marker.map = this.map; // Asegura que el marcador esté en el mapa
        }

        this.areaMarked = true;
        this.map.panTo(location);
      } else {
        if (this.marker) {
          this.marker.map = null; // Elimina el marcador del mapa
        }

        this.areaMarked = false;
        console.error('La ubicación no es válida.');
      }
    } catch (error) {
      console.error(error);
    }
  }

  goBack() {
    this.router.navigate(['/pasos/0']);
  }

  goToPaso2() {
    if (!this.areaMarked) {
      this.showTooltip();
      return; // No avanzar si no hay área marcada
    }
    const polygons = this.mapService.getPolygons();

    // Si todo está bien, avanzar al siguiente paso
    polygons[0].setEditable(false);
    this.mapService.setDrawingMode(null);

    this.router.navigate(['/pasos/2']);
  }

  private async initializeAutocomplete() {
    const input = document.getElementById('pac-input') as HTMLInputElement;
    const searchBox = new google.maps.places.SearchBox(input);

    // Restricciones geográficas
    new google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: 'ar' },
    });

    this.map.addListener('bounds_changed', () => {
      searchBox.setBounds(this.map.getBounds() as google.maps.LatLngBounds);
    });

    searchBox.addListener('places_changed', async () => {
      const places = searchBox.getPlaces();

      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          const { AdvancedMarkerElement } = (await google.maps.importLibrary(
            'marker'
          )) as google.maps.MarkerLibrary;
          this.map = this.mapService.getMap();
          if (!this.marker) {
            this.marker = new AdvancedMarkerElement({
              map: this.map,
            });
          }

          const location = await this.locationService.validateLocation(
            place.formatted_address || 'default',
            this.map,
            this.marker
          );
          if (location) {
            this.map.setCenter(location);
            // this.mapService.recenterMapAfterLocationSet(location);
          } else {
            if (this.marker) {
              this.marker.map = null; // Elimina el marcador del mapa
              this.marker = null; // Limpia la referencia al marcador
            }

            this.areaMarked = false;
            console.error('La ubicación no es válida.');
          }
        }
      }
      input.value = '';
    });
    input.value = '';
  }

  enableDrawingMode() {
    this.mapService.enableDrawingMode();
  }

  clearDrawing() {
    this.mapService.clearDrawing();
  }
}
