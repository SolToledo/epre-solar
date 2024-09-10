import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { DimensionPanel } from '../interfaces/dimension-panel';

@Injectable({
  providedIn: 'root',
})
export class SharedService {

  private dimensionPanel!: { height: number; width: number; };
  private areaPanelsSelectedSubject = new BehaviorSubject<number>(0);
  areaPanelsSelected$ = this.areaPanelsSelectedSubject.asObservable();

  private costoInstalacionSubject = new BehaviorSubject<number>(0);
  costoInstalacion$ = this.costoInstalacionSubject.asObservable();

  private tarifaContratadaSubject = new BehaviorSubject<string>('');
  tarifaContratada$ = this.tarifaContratadaSubject.asObservable();

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
  private panelCapacityWSubject = new BehaviorSubject<number>(400);
  panelCapacityW$ = this.panelCapacityWSubject.asObservable();
  private yearlyEnergyAcKwhSubject = new BehaviorSubject<number>(0);
  yearlyEnergyAcKwh$ = this.yearlyEnergyAcKwhSubject.asObservable();
  private ahorroAnualUsdPromedioSubject = new BehaviorSubject<number>(0);
  ahorroAnualUsdPromedio$ = this.ahorroAnualUsdPromedioSubject.asObservable();
  private potenciaMaxAsignadaSubject = new BehaviorSubject<number>(0);
  potenciaMaxAsignadaW$ = this.potenciaMaxAsignadaSubject.asObservable();
  private potenciaInstalacionSubject = new BehaviorSubject<number>(0);
  potenciaInstalacion$ = this.potenciaInstalacionSubject.asObservable();
  private resultadosFrontSubject = new BehaviorSubject<Partial<ResultadosFrontDTO>>({});
  resultadosFront$ = this.resultadosFrontSubject.asObservable();
  private maxPanelsPerSuperfaceSubject = new BehaviorSubject<number>(0);
  maxPanelsPerSuperface$ = this.maxPanelsPerSuperfaceSubject.asObservable();
  private CarbonOffSetTnAnualSubject = new BehaviorSubject<number>(0);
  CarbonOffSetTnAnual$ = this.CarbonOffSetTnAnualSubject.asObservable();
  private isStopCalculateSubject = new BehaviorSubject<boolean>(false);
  isStopCalculate$ = this.isStopCalculateSubject.asObservable();
  private consumosMensualesSubject = new BehaviorSubject<number[]>([]);
  consumosMensuales$ = this.consumosMensualesSubject.asObservable();
  private tarifaIntercambioUsdkWhSubject = new BehaviorSubject<number>(0);
  tarifaIntercambioUsdkWh$ = this.tarifaIntercambioUsdkWhSubject.asObservable();

  setTarifaContratada(tarifaContratada: string) {
    this.tarifaContratadaSubject.next(tarifaContratada);
  }

  getTarifaContratada(): string {
    return this.tarifaContratadaSubject.getValue();
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
    if (value < 4) {
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

  setPotenciaMaxAsignadaW(potenciaMaxAsignada: number) {
    this.potenciaMaxAsignadaSubject.next(potenciaMaxAsignada);
  }

  getPotenciaMaxAsignadaValue(): number {
    return this.potenciaMaxAsignadaSubject.getValue();
  }

  setPotenciaInstalacionW(instalacionPotencia: number) {
    if (instalacionPotencia > this.getPotenciaMaxAsignadaValue()) {
      this.setIsStopCalculate(true);

    } {
      this.setIsStopCalculate(false);
    }
    this.potenciaInstalacionSubject.next(instalacionPotencia);
  }

  getPotenciaInstalacionW() {
    return this.potenciaInstalacionSubject.getValue();
  }

  setResultadosFrontNearby(resultadosFrontNearby: ResultadosFrontDTO) {
    this.resultadosFrontSubject.next(resultadosFrontNearby);
  }

  getResultadosFrontNearby() {
    return this.resultadosFrontSubject.getValue();
  }

  setMaxPanelsPerSuperface(maxPanels: number) {
    this.setPotenciaInstalacionW(maxPanels * this.getPanelCapacityW())
    this.maxPanelsPerSuperfaceSubject.next(maxPanels);
  }

  getMaxPanelsPerSuperface() {
    return this.maxPanelsPerSuperfaceSubject.getValue();
  }

  setCarbonOffSetTnAnual(carbonOffSet: number) {
    this.CarbonOffSetTnAnualSubject.next(carbonOffSet);
  }

  getCarbonOffSetTnAnual() {
    return this.CarbonOffSetTnAnualSubject.getValue();
  }

  setIsStopCalculate(isStop: boolean) {
    this.isStopCalculateSubject.next(isStop);
  }

  getIsStopCalculate() {
    return this.isStopCalculateSubject.getValue();
  }

  setConsumosMensuales(consumos: any) {
    this.consumosMensualesSubject.next(consumos);
  }

  getConsumosMensuales() {
    return this.consumosMensualesSubject.getValue();
  }

  getTarifaIntercambioUsdkWh() {
    return this.tarifaIntercambioUsdkWhSubject.getValue();
  }

  setTarifaIntercambioUsdkWh(tarifaIntercambio: number) {
    this.tarifaIntercambioUsdkWhSubject.next(tarifaIntercambio);
  }

  getCostoInstalacion() {
    return this.costoInstalacionSubject.getValue();
  }
  setCostoInstalacion(costoInstalacion: number) {
    this.costoInstalacionSubject.next(Math.round(costoInstalacion));
  }

  calculateAreaPanelsSelected(totalPanels: number): number {
    if (totalPanels >= 4) {
      const areaPanelsSelected = this.calculateAreaPanels(totalPanels)
      this.setAreaPanelsSelected(areaPanelsSelected);
      return areaPanelsSelected;
    }
    return 0
  }
  calculateAreaPanels(panelsCount: number): number {
    const dimensionPanel: DimensionPanel = this.getDimensionPanel();
    const areaPanel = dimensionPanel.height * dimensionPanel.width;
    const areaPanels = areaPanel * panelsCount;
    return areaPanels;
  }
  setAreaPanelsSelected(areaPanelsSelected: number) {
    this.areaPanelsSelectedSubject.next(areaPanelsSelected);
  }
  getAreaPanelsSelected() {
    return this.areaPanelsSelectedSubject.getValue();
  }
  getDimensionPanel(): DimensionPanel {
    return this.dimensionPanel || {
      height: 1.879,
      width: 1.045
    }
  }
  setDimensionPanels(dimensionPanel: DimensionPanel) {
    this.dimensionPanel = dimensionPanel;
  }

}
