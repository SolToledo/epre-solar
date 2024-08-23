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
  predefinedCoordinates$ = this.predefinedCoordinatesSubject.asObservable();
  nearbyLocation: any;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();
  private panelsCountSelectedSubject = new BehaviorSubject<number>(0);
  panelsCountSelected$ = this.panelsCountSelectedSubject.asObservable();
  private plazoInversionSubject = new BehaviorSubject<number>(0);
  plazoInversion$ = this.plazoInversionSubject.asObservable();
  private isUpdating = false;
  private expandStep3Subject = new BehaviorSubject<boolean>(false);
  expandStep3$ = this.expandStep3Subject.asObservable();
  private panelCapacityWSubject = new BehaviorSubject<number>(0);
  panelCapacityW$ = this.panelCapacityWSubject.asObservable();
  private yearlyEnergyAcKwhSubject = new BehaviorSubject<number>(0);
  yearlyEnergyAcKwh$ = this.yearlyEnergyAcKwhSubject.asObservable();

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
    if(value < 4){
      this.panelsCountSelectedSubject.next(4);
      return
    }
    this.panelsCountSelectedSubject.next(value);
  }

  setPlazoInversion(plazo: number): void {
    this.plazoInversionSubject.next(plazo);
  }

  getPlazoInversionValue(): number {
    return this.plazoInversionSubject.getValue();
  }

  expandStep3(): void {
    this.expandStep3Subject.next(false);
  }

  getPanelsSelected() {
    return this.panelsCountSelectedSubject.getValue();
  }

  setPanelCapacityW(value: number) {
    this.panelCapacityWSubject.next(value);
  }

  getPanelCapacityW(): number {
    return this.panelCapacityWSubject.getValue();
  }

  setYearlyEnergyAcKwh(value: number): void {
    this.yearlyEnergyAcKwhSubject.next(value);
  }
  
  getYearlyEnergyAcKwh(): number {
    return this.yearlyEnergyAcKwhSubject.getValue();
  }
}
