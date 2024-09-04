import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, Subscription } from 'rxjs';
import { ResultadoService } from './resultado.service';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { ConsumoService } from './consumo.service';
import { MapService } from './map.service';
import { SharedService } from './shared.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolarDataFront } from '../interfaces/solar-data-front';

@Injectable({
  providedIn: 'root',
})
export class SolarApiService {
  // private readonly apiUrl: string = 'http://localhost:3000';
  private readonly apiUrl: string = 'https://0l5cvs6h-3000.brs.devtunnels.ms';
  private _resultados!: ResultadosFrontDTO;
  annualConsumption: number = 0;
  private panelsSupportedSubscription!: Subscription;
  panelsSupported: number = 0;
  private mapService!: MapService;
  potenciaMaxAsignada!: number;

  constructor(
    private http: HttpClient,
    private injector: Injector,
    private readonly resultadoService: ResultadoService,
    private consumoService: ConsumoService,
    private sharedService: SharedService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  private getMapService(): MapService {
    if (!this.mapService) {
      this.mapService = this.injector.get(MapService);
    }
    return this.mapService;
  }

  async calculate(): Promise<any> {
    const mapService = this.getMapService();
    try {
      const polygonCoordinates = mapService.getPolygonCoordinates();
      const polygonArea = mapService.getPolygonArea();
      const categoriaSeleccionada = this.sharedService.getTarifaContratada();

      this.consumoService.totalConsumo$.subscribe({
        next: (value) => (this.annualConsumption = value),
      });

      this.sharedService.maxPanelsPerSuperface$.subscribe({
        next: value => this.panelsSupported = value
      });

      this.sharedService.potenciaMaxAsignada$.subscribe({
        next: value => this.potenciaMaxAsignada = value
      })
      
      // Verifica los datos y muestra mensajes específicos
      const missingFields = [];
      if (!this.annualConsumption) missingFields.push('Consumo anual');
      if (!polygonCoordinates) missingFields.push('Coordenadas del polígono');
      if (!polygonArea) missingFields.push('Área del polígono');
      if (!categoriaSeleccionada) missingFields.push('Categoría seleccionada');
      if (!this.panelsSupported) missingFields.push('Paneles soportados');
      if (!this.potenciaMaxAsignada) missingFields.push('Potencia máxima asignada');

      if (missingFields.length > 0) {
        this.snackBar.open(
          `Faltan los siguientes datos: ${missingFields.join(', ')}`,
          'Cerrar',
          {
            duration: 5000,
            panelClass: ['error-snackbar'], 
            horizontalPosition: 'center',
            verticalPosition: 'top',
          }
        );

        setTimeout(() => {
          this.router
            .navigate(['/pasos/1'])
            .then(() => this.sharedService.setIsLoading(false));
        }, 2000);
        return;
      }

      const datosCalculo = {
        annualConsumption: this.annualConsumption,
        polygonCoordinates,
        categoriaSeleccionada,
        polygonArea,
        panelsSupported: this.panelsSupported,
        potenciaMaxAsignada: this.potenciaMaxAsignada
      };

      const response = await lastValueFrom(
        this.http.post<any>(`${this.apiUrl}/solar/calculate`, datosCalculo)
      );

      this._resultados = this.resultadoService.generarResultados(response);
      return this.getResultados;
    } catch (error) {
      console.error('Error en el cálculo:', error);
    }
  }

  get getResultados(): ResultadosFrontDTO {
    return this._resultados;
  }

  async calculateWithNearby(
    solarData: SolarDataFront
  ): Promise<ResultadosFrontDTO> {
    
    try {
      const response = await lastValueFrom(
        this.http.post<any>(`${this.apiUrl}/solar/calculate-nearby`, solarData)
      );
      // console.log("Response devuelta ", response);
      
      this._resultados = this.resultadoService.generarResultados(response);
     /*  console.log('NEARBY RESULTADOS FRONT ', this._resultados); */
      return this.getResultados;
    } catch (error) {
      console.error('Error en el cálculo con nearby:', error);
      throw error;
    }
  }
}
