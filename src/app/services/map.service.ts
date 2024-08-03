import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  
  private map!: google.maps.Map;
  private drawingManager!: google.maps.drawing.DrawingManager;
  private center: google.maps.LatLngLiteral = { lat: -31.5364, lng: -68.50639 };
  private zoom = 14;
  private mapSubject = new Subject<google.maps.Map>();
  private polygons: google.maps.Polygon[] = [];
  private overlayCompleteSubject = new Subject<boolean>();

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
      mapId: 'DEMO_MAP_ID',
    });
    this.mapSubject.next(this.map);
  }

  clearPolygons() {
    this.polygons.forEach((polygon) => polygon.setMap(null));
    this.polygons = [];
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
      drawingMode: null, // No drawing mode enabled by default
      drawingControl: false,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: '#00ff00',
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
          const newPolygon = event.overlay as google.maps.Polygon;
          this.polygons.push(newPolygon);
          this.overlayCompleteSubject.next(true);
        }
      }
    );
  }

  setDrawingMode(mode: google.maps.drawing.OverlayType | null) {
    if (this.drawingManager) {
      this.drawingManager.setDrawingMode(mode);
      this.drawingManager.setOptions({drawingControl:true})
    }
  }


  overlayComplete$(): Observable<boolean> {
    return this.overlayCompleteSubject.asObservable();
  }
}
