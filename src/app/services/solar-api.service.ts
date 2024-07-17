// solar-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SolarApiService {
  private apiUrl = 'http://localhost:3000'; 

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
              'The location is out of the coverage area of the solar API.';
          }
          alert(errorMessage); // Mostrar alerta en el frontend
          return throwError(() => new Error(errorMessage));
        })
      );
  }
}
