import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, Subscriber, Subscription } from 'rxjs';
import { ResultadoService } from './resultado.service';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { ConsumoService } from './consumo.service';
import { MapService } from './map.service';
import { SharedService } from './shared.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SolarApiService {
  private readonly apiUrl: string = 'http://localhost:3000';
  private _resultados!: ResultadosFrontDTO;
  annualConsumption: number = 0;
  private panelsSupportedSubscription!: Subscription;
  panelsSupported: number = 0;

  constructor(
    private http: HttpClient,
    private readonly resultadoService: ResultadoService,
    private consumoService: ConsumoService,
    private mapService: MapService,
    private sharedService: SharedService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  async calculate(): Promise<any> {
    try {
      const polygonCoordinates = this.mapService.getPolygonCoordinates();
      const polygonArea = this.mapService.getPolygonArea();
      const categoriaSeleccionada = this.sharedService.getTarifaContratada();

      this.consumoService.totalConsumo$.subscribe({
        next: value => this.annualConsumption = value,
      });
      
      this.panelsSupportedSubscription = this.mapService.maxPanelsPerArea$.subscribe({
        next: value => this.panelsSupported = value
      })
      // Verifica los datos y muestra mensajes específicos
      const missingFields = [];
      if (!this.annualConsumption) missingFields.push('Consumo anual');
      if (!polygonCoordinates) missingFields.push('Coordenadas del polígono');
      if (!polygonArea) missingFields.push('Área del polígono');
      if (!categoriaSeleccionada) missingFields.push('Categoría seleccionada');
      if (!this.panelsSupported) missingFields.push('Paneles soportados');

      if (missingFields.length > 0) {
        this.snackBar.open(
          `Faltan los siguientes datos: ${missingFields.join(', ')}`,
          'Cerrar',
          {
            duration: 5000,
          }
        );
        
        setTimeout(() => {
         // this.router.navigate(['/pasos/1']);
        }, 5000);
        return; 
      }

      const datosCalculo = {
        annualConsumption: this.annualConsumption,
        polygonCoordinates,
        categoriaSeleccionada,
        polygonArea,
        panelsSupported: this.panelsSupported,
      };
      console.log(datosCalculo);

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
}
