import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ResultadoService } from './resultado.service';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { ConsumoService } from './consumo.service';
import { MapService } from './map.service';
import { SharedService } from './shared.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class SolarApiService {
  private readonly apiUrl: string = 'http://localhost:3000';
  private _resultados!: ResultadosFrontDTO;

  constructor(
    private http: HttpClient,
    private readonly resultadoService: ResultadoService,
    private consumoService: ConsumoService,
    private mapService: MapService,
    private sharedService: SharedService,
    private router: Router
  ) {}

  async calculate(): Promise<any> {
    const polygonCoordinates = this.mapService.getPolygonCoordinates();
    const polygonArea = this.mapService.getPolygonArea();
    const categoriaSeleccionada = this.sharedService.getTarifaContratada();
    let annualConsumption: number = 0;
    let panelsSupported: number = 0;

    // Obtener el total de consumo anual
    this.consumoService.totalConsumo$.subscribe((total) => {
      annualConsumption = total;
    });

    // Obtener el número de paneles soportados
    await lastValueFrom(this.mapService.getPanelsCount()).then(count => {
      panelsSupported = count;
    });

    if (
      annualConsumption &&
      polygonCoordinates &&
      polygonArea &&
      categoriaSeleccionada &&
      panelsSupported
    ) {
      const datosCalculo = {
        annualConsumption,
        polygonCoordinates,
        categoriaSeleccionada,
        polygonArea,
        panelsSupported,
      };

      try {
        const response = await lastValueFrom(
          this.http.post<any>(`${this.apiUrl}/solar/calculate`, datosCalculo)
        );
        this._resultados = this.resultadoService.generarResultados(response);
        return this.getResultados;
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      console.error('Missing required data for calculation.');
      this.router.navigate(['/pasos/1']);
    }
  }

  get getResultados(): ResultadosFrontDTO {
    return this._resultados;
  }
}
