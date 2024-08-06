import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

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
  private maxPanelsPerSuperficeSubject = new BehaviorSubject<number>(0);
  private areaSubject = new BehaviorSubject<number>(0);

  constructor() {}

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

  getPolygons() {
    return this.polygons;
  }

  getMap() {
    return this.map;
  }

  setCenter(lat: number, lng: number) {
    this.center = { lat, lng };
    if (this.map) {
      this.map.setCenter(this.center);
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
        fillOpacity: 0.35,
        strokeWeight: 2,
        clickable: true,
        editable: true,
        zIndex: 1,
      },
    });
    this.drawingManager.setMap(this.map);

    google.maps.event.addListener(
      this.drawingManager,
      'overlaycomplete',
      (event: any) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          this.clearPolygons();
          this.clearPanels();
          const newPolygon = event.overlay as google.maps.Polygon;
          this.polygons.push(newPolygon);
          const area = google.maps.geometry.spherical.computeArea(
            newPolygon.getPath()
          );
          this.areaSubject.next(area);
          // Agregar el listener para el evento set_at
          google.maps.event.addListener(newPolygon.getPath(), 'set_at', () => {
            this.clearPanels();
            this.drawPanels(newPolygon);
            const area = google.maps.geometry.spherical.computeArea(
              newPolygon.getPath()
            );
            this.areaSubject.next(area);
            
          });

          this.overlayCompleteSubject.next(true);
          this.drawPanels(newPolygon);
        }
      }
    );
  }

  setDrawingMode(mode: google.maps.drawing.OverlayType | null) {
    if (this.drawingManager) {
      this.drawingManager.setDrawingMode(mode);
      this.drawingManager.setOptions({ drawingControl: true });
    }
  }

  overlayComplete$(): Observable<boolean> {
    return this.overlayCompleteSubject.asObservable();
  }
  overlayMaxPanelsPerSuperfice$(): Observable<number> {
    return this.maxPanelsPerSuperficeSubject.asObservable();
  }
  area$(): Observable<number> {
    return this.areaSubject.asObservable();
  }

  private drawPanels(polygon: google.maps.Polygon) {
    const bounds = new google.maps.LatLngBounds();
    polygon.getPath().forEach((latLng) => {
      bounds.extend(latLng);
    });

    const panelWidthMeters = 1.045; // Ancho en metros
    const panelHeightMeters = 1.879; // Alto en metros

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

    const numPanelsX = Math.floor(boundsWidth / panelWidthDegrees);
    const numPanelsY = Math.floor(boundsHeight / panelHeightDegrees);

    const offsetX = (boundsWidth - numPanelsX * panelWidthDegrees) / 2;
    const offsetY = (boundsHeight - numPanelsY * panelHeightDegrees) / 2;

    const panels: google.maps.Rectangle[] = [];

    for (let i = 0; i < numPanelsX; i++) {
      for (let j = 0; j < numPanelsY; j++) {
        const panelBounds = new google.maps.LatLngBounds(
          {
            lat: southWest.lat() + offsetY + j * panelHeightDegrees,
            lng: southWest.lng() + offsetX + i * panelWidthDegrees,
          },
          {
            lat: southWest.lat() + offsetY + (j + 1) * panelHeightDegrees,
            lng: southWest.lng() + offsetX + (i + 1) * panelWidthDegrees,
          }
        );

        // Asegurarse de que el rectángulo esté dentro de los límites del polígono
        if (
          bounds.contains(panelBounds.getNorthEast()) &&
          bounds.contains(panelBounds.getSouthWest())
        ) {
          const panelRectangle = new google.maps.Rectangle({
            bounds: panelBounds,
            fillColor: '#000000',
            fillOpacity: 0.7,
            strokeColor: '#FFA500',
            strokeWeight: 0.5,
            map: this.map,
            zIndex: 1,
          });
          panels.push(panelRectangle);
        }
      }
    }

    this.panels = panels;
    const maxPanelsCount = panels.length;
    this.maxPanelsPerSuperficeSubject.next(maxPanelsCount);
    this.clipPanelsToPolygon(polygon, panels);
  }

  clipPanelsToPolygon(
    polygon: google.maps.Polygon,
    panels: google.maps.Rectangle[]
  ) {
    panels.forEach((panel) => {
      const panelBounds = panel.getBounds();
      const northEast = panelBounds!.getNorthEast();
      const southWest = panelBounds!.getSouthWest();

      const vertices = [
        northEast,
        new google.maps.LatLng(northEast.lat(), southWest.lng()),
        southWest,
        new google.maps.LatLng(southWest.lat(), northEast.lng()),
      ];

      const inside = vertices.every((vertex) =>
        google.maps.geometry.poly.containsLocation(vertex, polygon)
      );

      if (!inside) {
        panel.setMap(null);
      }
    });
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

  getPolygonArea(): number | null {
    if (this.polygons.length > 0) {
      const path = this.polygons[0].getPath();
      return google.maps.geometry.spherical.computeArea(path);
    }
    return null; // Si no hay polígono, devuelve null
  }

  getPanelsCount(): number {
    return this.panels.length;
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
  }

  clearDrawing() {
    this.clearPolygons();
    this.clearPanels();
    this.disableDrawingMode();
  }
}
