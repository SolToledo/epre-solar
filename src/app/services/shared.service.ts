import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private tarifaContratada: string = '';
  private tutorialShownSubject = new BehaviorSubject<boolean>(false);
  tutorialShown$ = this.tutorialShownSubject.asObservable();
  private predefinedCoordinatesSubject = new BehaviorSubject<boolean>(false);
  predefinedCoordinates$ = this.tutorialShownSubject.asObservable();
  nearbyLocation: any;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private panelsCountSelectedSubject = new BehaviorSubject<number>(0);
  panelsCountSelected$ = this.panelsCountSelectedSubject.asObservable();
  private plazoInversionSubject = new BehaviorSubject<number>(0);
  plazoInversion$ = this.plazoInversionSubject.asObservable();
  private isUpdating = false;

  setTarifaContratada(tarifaContratada: string) {
    this.tarifaContratada = tarifaContratada;
  }

  getTarifaContratada(): string {
    return this.tarifaContratada;
  }

  setTutorialShown(value: boolean): void {
    this.tutorialShownSubject.next(value);
  }

  setPredefinedCoordinates(value: boolean): void {
    this.predefinedCoordinatesSubject.next(value);
  }

  setNearbyLocation(location: any) {
    this.nearbyLocation = location;
  }

  getNearbyLocation() {
    return this.nearbyLocation;
  }

  setIsLoading(value: boolean): void {
    this.isLoadingSubject.next(value);
  }
  setPanelsCountSelected(value: number): void {
    this.panelsCountSelectedSubject.next(value);
  }

  setPlazoInversion(plazo: number): void {
    if (this.isUpdating) return;
    this.isUpdating = true;
    this.plazoInversionSubject.next(plazo);
    this.isUpdating = false;
  }

  getPlazoInversionValue(): number {
    return this.plazoInversionSubject.getValue();
  }
}
