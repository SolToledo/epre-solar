import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  
  private areaCoords: { lat: number, lng: number }[] = [];
  private mapConfig: any;

  constructor() {
    this.loadCoordsFromLocalStorage();
    this.loadMapConfigFromLocalStorage();
  }

  private loadCoordsFromLocalStorage() {
    const storedCoords = localStorage.getItem('polygonCoordinates');
    if (storedCoords) {
      this.areaCoords = JSON.parse(storedCoords);
    }
  }

  private loadMapConfigFromLocalStorage() {
    const storedMapConfig = localStorage.getItem('mapConfig');
    if (storedMapConfig) {
      this.mapConfig = JSON.parse(storedMapConfig);
    }
  }

  private saveCoordsToLocalStorage() {
    localStorage.setItem('polygonCoordinates', JSON.stringify(this.areaCoords));
  }

  private saveMapConfigToLocalStorage() {
    localStorage.setItem('mapConfig', JSON.stringify(this.mapConfig));
  }

  setAreaCoords(coords: { lat: number, lng: number }[]) {
    this.areaCoords = coords;
    this.saveCoordsToLocalStorage();
  }

  getAreaCoords() {
    return this.areaCoords;
  }

  setMapConfig(config: any) {
    this.mapConfig = config;
    this.saveMapConfigToLocalStorage();
  }

  getMapConfig() {
    return this.mapConfig;
  }

  setSelectedArea(selectedArea: number) {
    localStorage.setItem('selectedAreaM2', JSON.stringify(selectedArea));
  }
}
