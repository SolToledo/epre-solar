// solar-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ResultadoService } from './resultado.service';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';

@Injectable({
  providedIn: 'root',
})
export class SolarApiService {
  // private readonly apiUrl: string = 'http://localhost:3000';
  private _resultados!: ResultadosFrontDTO;
  private apiUrl = 'https://0l5cvs6h-3000.brs.devtunnels.ms';

  constructor(
    private http: HttpClient,
    private readonly resultadoService: ResultadoService
  ) {}

  async calculate(): Promise<any> {
    const annualConsumptionStr = localStorage.getItem(
      'annualKWhEnergyConsumption'
    );
    const coordenadasStr = localStorage.getItem('polygonCoordinates');
    const selectedAreaStr = localStorage.getItem('selectedAreaM2');
    const categoriaSeleccionada = localStorage.getItem('categoriaSeleccionada');
    if (
      annualConsumptionStr &&
      coordenadasStr &&
      selectedAreaStr &&
      categoriaSeleccionada
    ) {
      const datosCalculo = {
        annualConsumption: JSON.parse(annualConsumptionStr),
        coordenadas: JSON.parse(coordenadasStr),
        categoriaSeleccionada: JSON.parse(categoriaSeleccionada),
        selectedAreaM2: JSON.parse(selectedAreaStr),
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
    }
  }

  get getResultados(): ResultadosFrontDTO {
    return this._resultados;
  }
}
