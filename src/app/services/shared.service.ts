import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';

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
  private ahorroAnualUsdPromedioSubject = new BehaviorSubject<number>(0);
  ahorroAnualUsdPromedio$ = this.ahorroAnualUsdPromedioSubject.asObservable();
  private potenciaMaxAsignadaSubject = new BehaviorSubject<number>(0);
  potenciaMaxAsignada$ = this.potenciaMaxAsignadaSubject.asObservable();
  private potenciaInstalacionSubject = new BehaviorSubject<number>(0);
  potenciaInstalacion$ = this.potenciaInstalacionSubject.asObservable();
  private resultadosFrontSubject = new BehaviorSubject<Partial<ResultadosFrontDTO>>({});
  resultadosFront$ = this. resultadosFrontSubject.asObservable();
  private maxPanelsPerSuperfaceSubject = new BehaviorSubject<number>(0);
  maxPanelsPerSuperface$ = this.maxPanelsPerSuperfaceSubject.asObservable();
  private carbonOffSetSubject = new BehaviorSubject<number>(0);
  carbonOffSet$ = this.carbonOffSetSubject.asObservable();

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

  getPanelsSelected() {
    return this.panelsCountSelectedSubject.getValue();
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

  setAhorroAnualUsdPromedio(ahorroPromedio: number) {
    this.ahorroAnualUsdPromedioSubject.next(ahorroPromedio);
  }

  getAhorroAnualUsdPromedio() {
    return this.ahorroAnualUsdPromedioSubject.getValue();
  }

  setPotenciaMaxAsignada(potenciaMaxAsignada: number) {
    this.potenciaMaxAsignadaSubject.next(potenciaMaxAsignada);
  }
  
  getPotenciaMaxAsignadaValue(): number {
    return this.potenciaMaxAsignadaSubject.getValue();
  }

  setPotenciaInstalacion(instalacionPotencia: number) {
    if(instalacionPotencia > this.getPotenciaMaxAsignadaValue()){
      
    }
    this.potenciaInstalacionSubject.next(instalacionPotencia);
  }

  getPotenciaInstalacion() {
    return this.potenciaInstalacionSubject.getValue();
  }

  setResultadosFrontNearby(resultadosFrontNearby: ResultadosFrontDTO) {
    this.resultadosFrontSubject.next(resultadosFrontNearby);
  }

  getResultadosFrontNearby() {
    return this.resultadosFrontSubject.getValue();
  }

  setMaxPanelsPerSuperface(maxPanels: number) {
    return this.maxPanelsPerSuperfaceSubject.next(maxPanels);
  }

  getMaxPanelsPerSuperface() {
    return this.maxPanelsPerSuperfaceSubject.getValue();
  }

  setCarbonOffSet(carbonOffSet: number) {
    return this.carbonOffSetSubject.next(carbonOffSet);
  }

  getCarbonOffSet() {
    return this.carbonOffSetSubject.getValue();
  }
  
  
  
}
