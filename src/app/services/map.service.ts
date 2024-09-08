import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { LocationService } from './location.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private map!: google.maps.Map;
  private drawingManager!: google.maps.drawing.DrawingManager;
  private center: google.maps.LatLngLiteral = { lat: -31.5364, lng: -68.50639 };
  private zoomInicial = 13;
  zoom: number = this.zoomInicial;
  private mapSubject = new Subject<google.maps.Map>();
  private polygons: google.maps.Polygon[] = [];
  private panels: google.maps.Rectangle[] = [];

  private overlayCompleteSubject = new Subject<boolean>();
  private areaSubject = new BehaviorSubject<number>(0);
  area$ = this.areaSubject.asObservable();
  private maxPanelsPerAreaSubject = new BehaviorSubject<number>(0);
  maxPanelsPerArea$ = this.maxPanelsPerAreaSubject.asObservable();

  private panelWidthMeters = 1.045;
  private panelHeightMeters = 1.879;
  polygonAux!: google.maps.Polygon;

  constructor(
    private locationService: LocationService,
    private snackBar: MatSnackBar,
    private sharedService: SharedService
  ) {}

  async initializeMap(mapElement: HTMLElement) {
    const { Map } = (await google.maps.importLibrary(
      'maps'
    )) as google.maps.MapsLibrary;

    this.map = new Map(mapElement, {
      center: this.center,
      zoom: this.zoomInicial,
      disableDefaultUI: false,
      zoomControl: false,
      mapTypeId: google.maps.MapTypeId.HYBRID,
      mapTypeControl: false,
      zoomControlOptions: {
        position: google.maps.ControlPosition.INLINE_START_BLOCK_END,
      },
      fullscreenControl: false,
      streetViewControl: false,
      rotateControl: false,
      gestureHandling: 'cooperative',
      styles: [
        // Ocultar todos los elementos geométricos (carreteras, paisajes, etc.)
        {
          featureType: 'all',
          elementType: 'geometry',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'all',
          elementType: 'geometry.stroke',
          stylers: [{ visibility: 'off' }]
        },
        // Ocultar todas las etiquetas excepto las de las calles
        {
          featureType: 'administrative',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'water',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        // Mostrar solo las etiquetas de las carreteras (nombres de las calles)
        {
          featureType: 'road',
          elementType: 'labels.text',
          stylers: [{ visibility: 'on' }]
        },
        {
          featureType: 'road',
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });
    this.mapSubject.next(this.map);
  }

  clearPolygons() {
    this.polygons.forEach((polygon) => polygon.setMap(null));
    this.polygons = [];
  }

  clearPanels() {
    this.panels.forEach((panel) => panel.setMap(null));
    this.panels = [];
  }

  getMap() {
    return this.map;
  }

  setCenter(lat: number, lng: number) {
    this.center = { lat, lng };
    if (this.map) {
      this.map.setCenter(this.center);
    }
    this.recenterMapToVisibleArea();
  }

  recenterMapToVisibleArea() {
    const bounds = new google.maps.LatLngBounds();
    this.getPolygons().forEach((polygon) => {
      polygon.getPath().forEach((latLng) => bounds.extend(latLng));
    });

    const mapCenter = bounds.getCenter();

    // Calcular el nuevo centro considerando el desplazamiento hacia la izquierda de 1/4 del ancho de la pantalla
    const screenWidth = window.innerWidth; // Ancho de la pantalla en píxeles
    const offsetX = screenWidth / 4; // Desplazamiento de 1/4 del ancho de la pantalla

    const zoom = this.map.getZoom() ?? 1;
    const scale = Math.pow(2, zoom);
    const worldCoordinateCenter = this.map
      .getProjection()
      ?.fromLatLngToPoint(mapCenter);

    if (worldCoordinateCenter) {
      const pixelOffset = offsetX / scale;
      const newCenter = this.map
        .getProjection()
        ?.fromPointToLatLng(
          new google.maps.Point(
            worldCoordinateCenter.x + pixelOffset,
            worldCoordinateCenter.y
          )
        );

      if (newCenter) {
        this.map.panTo(newCenter);
      } else {
        console.error('No se pudo calcular el nuevo centro del mapa.');
      }
    }
  }

  recenterMapAfterLocationSet(location: google.maps.LatLng) {
    const offsetX = window.innerWidth / 4; // Desplazamiento de 1/4 del ancho de la pantalla
    const zoom = this.map.getZoom() ?? 1;
    const scale = Math.pow(2, zoom);
    const projection = this.map.getProjection();

    if (projection) {
      const worldCoordinateCenter = projection.fromLatLngToPoint(location);

      if (worldCoordinateCenter) {
        const pixelOffset = offsetX / scale;
        const newCenter = projection.fromPointToLatLng(
          new google.maps.Point(
            worldCoordinateCenter.x + pixelOffset,
            worldCoordinateCenter.y
          )
        );

        if (newCenter) {
          this.map.panTo(newCenter);
        } else {
          console.error('No se pudo calcular el nuevo centro del mapa.');
        }
      }
    }
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
    if (this.map) {
      this.map.setZoom(this.zoom);
    }
  }

  map$() {
    return this.mapSubject.asObservable();
  }

  getDrawingManager(): google.maps.drawing.DrawingManager {
    return this.drawingManager;
  }

  initializeDrawingManager() {
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: '#808080',
        fillOpacity: 0.5,
        strokeWeight: 3,
        strokeColor: '#00FF00',
        clickable: true,
        editable: true,
        zIndex: 1,
        geodesic: true,
        strokePosition: google.maps.StrokePosition.OUTSIDE
      },
    });
    this.drawingManager.setMap(this.map);

    // Listener para overlaycomplete
    google.maps.event.addListener(
      this.drawingManager,
      'overlaycomplete',
      (event: any) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          this.clearPolygons();
          this.clearPanels();

          const newPolygon = event.overlay as google.maps.Polygon;
          this.polygons.push(newPolygon);

          // Validar el área inicial
          if (!this.validateArea(newPolygon)) {
            this.clearDrawing();
            return;
          }

          const path = newPolygon.getPath();
          const isLocationValid = this.locationService.validatePolygonLocation(
            newPolygon,
            this.map
          );

          if (isLocationValid) {
            const area = google.maps.geometry.spherical.computeArea(path);
            this.areaSubject.next(area);

            // Listener para el evento set_at en el polígono (cuando se edita)
            const updatePolygonAfterEdit = () => {
              const newPolygonEdit = event.overlay as google.maps.Polygon;
              const updatedArea =
                google.maps.geometry.spherical.computeArea(path);
              if (this.validateArea(newPolygonEdit)) {
                newPolygonEdit.setMap(this.map); // Asegura que el polígono editado se muestre
                this.polygons[0] = newPolygonEdit;
                this.drawPanels(newPolygonEdit);
                this.overlayCompleteSubject.next(true);
                this.disableDrawingMode();
                return;
              } else {
                console.log('no es valido');
              }
            };

            google.maps.event.addListener(
              path,
              'set_at',
              updatePolygonAfterEdit
            );
            google.maps.event.addListener(
              path,
              'insert_at',
              updatePolygonAfterEdit
            );

            // Dibuja los paneles
            this.drawPanels(newPolygon);
            this.overlayCompleteSubject.next(true);
            this.disableDrawingMode();
            // Obtener el centro del polígono para recentrar el mapa
            const bounds = new google.maps.LatLngBounds();
            path.forEach((latLng) => bounds.extend(latLng));
            const polygonCenter = bounds.getCenter();

            this.map.panTo(polygonCenter);
            return;
          } else {
            this.snackBar.open(
              'La ubicación seleccionada se encuentra fuera de la Provincia de San Juan, no se puede procesar.',
              '',
              {
                duration: 5000,
                panelClass: ['custom-snackbar'],
                horizontalPosition: 'center',
                verticalPosition: 'top',
              }
            );
            this.map.panTo(this.center);
            this.map.setZoom(13);
            this.clearDrawing();
            this.areaSubject.next(0);
            this.overlayCompleteSubject.next(false);
          }
        }
      }
    );
  }

  private validateArea(polygon: google.maps.Polygon): boolean {
    const area = this.getPolygonArea(polygon);
    const minArea = this.sharedService.calculateAreaPanels(1) * 5;
    const maxArea = this.sharedService.calculateAreaPanels(100); 

    if (area < minArea) {
      this.snackBar.open(
        'La selección es demasiado pequeña. El área seleccionada debe ser suficiente para al menos 4 paneles.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['custom-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
      this.overlayCompleteSubject.next(false);
      this.clearPanels();
      return false;
    }

    if (area > maxArea) {
      this.snackBar.open(
        `La selección es demasiado grande. Por favor, reduzca la seleccion a un área menor a ${maxArea} m².`,
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['custom-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
      this.overlayCompleteSubject.next(false);
      this.setDrawingMode(null);
      return false;
    }
    return true;
  }

  setDrawingMode(mode: google.maps.drawing.OverlayType | null) {
    if (!this.drawingManager) {
      this.initializeDrawingManager();
      return;
    }
    this.drawingManager.setDrawingMode(mode);
    this.drawingManager.setOptions({ drawingControl: true });
  }

  overlayComplete$(): Observable<boolean> {
    return this.overlayCompleteSubject.asObservable();
  }

  private drawPanels(
    polygon: google.maps.Polygon,
    maxPanels: number = Infinity,
    isReDraw: boolean = false
  ) {
    const margin: number = 0.1;
    this.clearPanels();
    
    const bounds = new google.maps.LatLngBounds();
    polygon.getPath().forEach((latLng) => {
      bounds.extend(latLng);
    });

    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();

    const centerLat = (northEast.lat() + southWest.lat()) / 2;
    const centerLng = (northEast.lng() + southWest.lng()) / 2;
    const radiansLat = centerLat * (Math.PI / 180);

    const panelWidthDegrees =
      this.panelWidthMeters / (111320 * Math.cos(radiansLat));
    const panelHeightDegrees = this.panelHeightMeters / 110574;
    const boundsWidth = Math.abs(northEast.lng() - southWest.lng());
    const boundsHeight = Math.abs(northEast.lat() - southWest.lat());

    // Aplicar margen interno
    const adjustedBoundsWidth = boundsWidth * (1 - margin);
    const adjustedBoundsHeight = boundsHeight * (1 - margin);

    const numPanelsX = Math.floor(adjustedBoundsWidth / panelWidthDegrees);
    const numPanelsY = Math.floor(adjustedBoundsHeight / panelHeightDegrees);

    const offsetX = (boundsWidth - numPanelsX * panelWidthDegrees) / 2;
    const offsetY = (boundsHeight - numPanelsY * panelHeightDegrees) / 2;

    // 9% reducción de área
    const areaReducida = this.getPolygonArea(polygon) * 0.9;
    this.areaSubject.next(areaReducida);
    const maxPanelsEfectivos = Math.floor(areaReducida / this.panelArea);

    let totalPanels = 0;
    const max = isReDraw ? maxPanels : maxPanelsEfectivos;

    for (let i = 0; i < numPanelsX && totalPanels < max; i++) {
      for (let j = 0; j < numPanelsY && totalPanels < max; j++) {
        const southWestCorner = new google.maps.LatLng(
          southWest.lat() + offsetY + j * panelHeightDegrees,
          southWest.lng() + offsetX + i * panelWidthDegrees
        );
        const northEastCorner = new google.maps.LatLng(
          southWest.lat() + offsetY + (j + 1) * panelHeightDegrees,
          southWest.lng() + offsetX + (i + 1) * panelWidthDegrees
        );

        // Verificar si las 4 esquinas del panel están dentro del polígono
        const corners = [
          southWestCorner,
          new google.maps.LatLng(southWestCorner.lat(), northEastCorner.lng()),
          northEastCorner,
          new google.maps.LatLng(northEastCorner.lat(), southWestCorner.lng()),
        ];

        const allCornersInside = corners.every((corner) =>
          google.maps.geometry.poly.containsLocation(corner, polygon)
        );

        if (allCornersInside) {
          const panelRectangle = new google.maps.Rectangle({
            bounds: new google.maps.LatLngBounds(
              southWestCorner,
              northEastCorner
            ),
            fillColor: '#000000',
            fillOpacity: 0.7,
            strokeColor: '#FFFFFF',
            strokeWeight: 0.5,
            map: this.map,
          });

          this.panels.push(panelRectangle);
          totalPanels++;
        }
      }
    }

    if (!isReDraw) {
      this.sharedService.setMaxPanelsPerSuperface(totalPanels);
      if (this.sharedService.getPanelsSelected() > totalPanels) {
        this.sharedService.setPanelsCountSelected(totalPanels);
      }
    }
    this.sharedService.calculateAreaPanelsSelected(totalPanels);
  }

  reDrawPanels(panelesCantidad: number) {
    if (!this.validateArea(this.getPolygons()[0])) {
      this.clearDrawing();
      return;
    }
    this.drawPanels(this.getPolygons()[0], panelesCantidad, true);
  }

  getPolygons() {
    return this.polygons;
  }

  getPolygonCoordinates(): google.maps.LatLngLiteral[] | null {
    if (this.polygons.length > 0) {
      const path = this.polygons[0].getPath();
      const coordinates: google.maps.LatLngLiteral[] = [];
      path.forEach((latLng) => {
        coordinates.push({ lat: latLng.lat(), lng: latLng.lng() });
      });
      return coordinates;
    }
    return null;
  }

  getPolygonArea(polygon?: google.maps.Polygon): number {
    if (this.polygons.length > 0) {
      const path = polygon?.getPath() ?? this.getPolygons()[0].getPath();
      const area = google.maps.geometry.spherical.computeArea(path!);

      return area;
    }
    this.areaSubject.next(0);
    return 0;
  }

  get panelArea(): number {
    return this.panelWidthMeters * this.panelHeightMeters;
  }

  hideDrawingControl() {
    if (this.drawingManager) {
      this.drawingManager.setOptions({
        drawingControl: false,
      });
    }
  }

  showDrawingControl() {
    if (this.drawingManager) {
      this.drawingManager.setOptions({
        drawingControl: true,
      });
    }
  }

  enableDrawingMode() {
    this.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
  }

  disableDrawingMode() {
    this.setDrawingMode(null);
    this.hideDrawingControl();
  }

  clearDrawing() {
    this.clearPolygons();
    this.clearPanels();
    this.disableDrawingMode();
  }
}
