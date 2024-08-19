import { Injectable } from '@angular/core';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { GmailService } from './gmail.service';

@Injectable({
  providedIn: 'root',
})
export class ResultadoService {
  private resultados!: ResultadosFrontDTO;
  constructor(private gmailService: GmailService) {}

  generarResultados(response: any): ResultadosFrontDTO {
    
    this.checkUpdatePanelCapacity(response.solarData.panels.panelCapacityW);
    
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

  private checkUpdatePanelCapacity(newPanelCapacityW: number): void {
    if(newPanelCapacityW !== 400) {
      this.gmailService.sendEmailChangeCapacityInApi(newPanelCapacityW);
    }
  }
}
