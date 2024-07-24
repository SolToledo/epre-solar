// solar-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { MesesConsumo } from '../interfaces/mesesConsumo';

@Injectable({
  providedIn: 'root',
})
export class SolarApiService {
  private apiUrl = 'http://localhost:3000';
  // private apiUrl = 'https://0l5cvs6h-3000.brs.devtunnels.ms';
  

  constructor(private http: HttpClient) {}

  enviarCoordenadas(coordenadas: any[]): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/solar/calcular`, coordenadas)
      .pipe(
        catchError((error) => {
          let errorMessage = 'An error occurred while fetching solar data.';
          if (
            error.status === 400 &&
            error.error.message === 'Location out of coverage'
          ) {
            errorMessage =
              'La ubicación seleccionada se encuentra fuera de la cobertura de la solar API.';
          }
          alert(errorMessage); // Mostrar alerta en el frontend
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  cargarConsumosAnuales(meses: MesesConsumo[]): void {
    this.http
      .post<MesesConsumo[]>(
        `${this.apiUrl}/google-sheets/cargarConsumos`,
        meses
      )
      .subscribe({
        next: (response) => console.log('Consumos anuales enviados:', response),
        error: (error) =>
          console.error('Error al enviar los consumos anuales:', error),
      });
  }
}
