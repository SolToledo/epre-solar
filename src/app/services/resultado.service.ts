import { Injectable } from '@angular/core';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { GmailService } from './gmail.service';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root',
})
export class ResultadoService {
  private resultados!: ResultadosFrontDTO;
  constructor(private gmailService: GmailService, private sharedService: SharedService) {}

  generarResultados(response: any): ResultadosFrontDTO {
    
    this.checkUpdatePanelCapacity(response.solarData.panels.panelCapacityW);
    
    return (this.resultados = {
      solarData: response.solarData,
      periodoVeinteanalGeneracionFotovoltaica: response.periodoVeinteanalGeneracionFotovoltaica,
      periodoVeinteanalFlujoEnergia: response.periodoVeinteanalFlujoEnergia,
      periodoVeinteanalFlujoIngresosMonetarios:
        response.periodoVeinteanalFlujoIngresosMonetarios,
      ahorroUsdPromedio : this.ahorrosUsdCalcularPromediosVeinteanales(response.periodoVeinteanalFlujoIngresosMonetarios),
      periodoVeinteanalEmisionesGEIEvitadas: response.periodoVeinteanalEmisionesGEIEvitadas,
      periodoVeinteanalProyeccionTarifas: response.periodoVeinteanalProyeccionTarifas,
      resultadosFinancieros: response.resultadosFinancieros
    });
  }
  ahorrosUsdCalcularPromediosVeinteanales(periodoVeinteanalFlujoIngresosMonetarios: any[]) {
    const sumaAhorros = periodoVeinteanalFlujoIngresosMonetarios.reduce((acumulador, anio) => {
      return acumulador + anio.ahorroEnElectricidadTotalUsd;
    }, 0);
  
    // Calcula el promedio dividiendo la suma por el número de anios
    const ahorroPromedio = sumaAhorros / periodoVeinteanalFlujoIngresosMonetarios.length;
    this.sharedService.setAhorroAnualUsdPromedio(ahorroPromedio);
    return ahorroPromedio;
  }

  private checkUpdatePanelCapacity(newPanelCapacityW: number): void {
    if(newPanelCapacityW !== 400) {
      this.gmailService.sendEmailChangeCapacityInApi(newPanelCapacityW);
    }
  }
}
