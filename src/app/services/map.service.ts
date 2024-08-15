import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, Subject } from 'rxjs';
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
  private zoom = 22;
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
      zoom: this.zoom,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      mapTypeControl: false,
      zoomControlOptions: {
        position: google.maps.ControlPosition.INLINE_START_BLOCK_END,
      },
      fullscreenControl: false,
      streetViewControl: false,
      rotateControl: true,
      gestureHandling: 'cooperative',
      mapId: 'DEMO_MAP_ID',
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
      },
    });
    this.drawingManager.setMap(this.map);

    // Listener para overlaycomplete
    google.maps.event.addListener(
      this.drawingManager,
      'overlaycomplete',
      async (event: any) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          this.clearPolygons();
          this.clearPanels();

          const newPolygon = event.overlay as google.maps.Polygon;
          this.polygons.push(newPolygon);
          if (!this.validateArea(newPolygon)) {
            this.clearDrawing();
            return;
          }

          const path = newPolygon.getPath();

          const isLocationValid =
            await this.locationService.validatePolygonLocation(
              newPolygon,
              this.map
            );

          if (isLocationValid) {
            const area = google.maps.geometry.spherical.computeArea(path);
            this.areaSubject.next(area);

            // Listener para el evento set_at en el polígono
            google.maps.event.addListener(path, 'set_at', () => {
              if (!this.validateArea(newPolygon)) {
                return;
              }
              newPolygon.setMap(this.map); // Muestra el polígono
              this.polygons[0] = newPolygon;
              this.drawPanels(this.polygons[0]);
              this.overlayCompleteSubject.next(true);
              this.disableDrawingMode();
            });

            this.drawPanels(newPolygon);
            this.overlayCompleteSubject.next(true);
            this.disableDrawingMode();
            // Obtener el centro del polígono para recentrar el mapa
            const bounds = new google.maps.LatLngBounds();
            path.forEach((latLng) => bounds.extend(latLng));
            const polygonCenter = bounds.getCenter();

            // Llamar al método recenterMapAfterLocationSet con el centro del polígono
            this.recenterMapAfterLocationSet(polygonCenter);
          } else {
            this.snackBar.open(
              'La ubicación ingresada no se puede procesar.',
              '',
              {
                duration: 3000,
                panelClass: ['custom-snackbar'],
              }
            );
          }
        }
      }
    );
  }

  private validateArea(polygon: google.maps.Polygon): boolean {
    const area = this.getPolygonArea(polygon);
    const minArea = 7; // Área mínima para cuatro paneles
    const maxArea = 100; // 100 metros cuadrados

    if (area < minArea) {
      this.snackBar.open(
        'La selección es demasiado pequeña. El área seleccionada debe ser suficiente para al menos 4 paneles.',
        'Cerrar',
        { duration: 5000 }
      );
      this.overlayCompleteSubject.next(false);
      return false;
    }

    if (area > maxArea) {
      this.snackBar.open(
        'La selección es demasiado grande. Por favor, seleccione un área menor a 100 metros cuadrados.',
        'Cerrar',
        { duration: 5000 }
      );
      this.overlayCompleteSubject.next(false);
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

    const panelWidthMeters = 1.045;
    const panelHeightMeters = 1.879;

    const northEast = bounds.getNorthEast();
    const southWest = bounds.getSouthWest();

    const centerLat = (northEast.lat() + southWest.lat()) / 2;
    const centerLng = (northEast.lng() + southWest.lng()) / 2;
    const radiansLat = centerLat * (Math.PI / 180);

    const panelWidthDegrees =
      panelWidthMeters / (111320 * Math.cos(radiansLat));
    const panelHeightDegrees = panelHeightMeters / 110574;
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
      this.maxPanelsPerAreaSubject.next(totalPanels);
    }
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
      const area = google.maps.geometry.spherical.computeArea(path);

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
