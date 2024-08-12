import { Injectable } from '@angular/core';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';

@Injectable({
  providedIn: 'root',
})
export class ResultadoService {
  private resultados!: ResultadosFrontDTO;
  constructor() {}

  generarResultados(response: any): ResultadosFrontDTO {
    console.log({response});
    
    return (this.resultados = {
      solarData: response.solarData,
      periodoVeinteanalGeneracionFotovoltaica: response.periodoVeinteanalGeneracionFotovoltaica,
      periodoVeinteanalFlujoEnergia: response.periodoVeinteanalFlujoEnergia,
      periodoVeinteanalFlujoIngresosMonetarios:
        response.periodoVeinteanalFlujoIngresosMonetarios,
      periodoVeinteanalEmisionesGEIEvitadas: response.periodoVeinteanalEmisionesGEIEvitadas,
      periodoVeinteanalProyeccionTarifas: response.periodoVeinteanalProyeccionTarifas,
      resultadosFinancieros: response.resultadosFinancieros
    });
  }
}
