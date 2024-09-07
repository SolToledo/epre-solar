import { Injectable } from '@angular/core';
import { ResultadosFrontDTO } from '../interfaces/resultados-front-dto';
import { GmailService } from './gmail.service';
import { SharedService } from './shared.service';
import { FlujoIngresosMonetariosFront } from '../interfaces/flujo-ingresos-monetarios-front';

@Injectable({
  providedIn: 'root',
})
export class ResultadoService {
  private resultados!: ResultadosFrontDTO;
  constructor(
    private gmailService: GmailService,
    private sharedService: SharedService
  ) { }

  generarResultados(response: any): ResultadosFrontDTO {
    console.log('response para generar resultados', response);
    this.checkUpdatePanelCapacity(response.solarData.panels.panelCapacityW);

    return (this.resultados = {
      solarData: response.solarData,
      parametros: response.parametros,
      periodoVeinteanalGeneracionFotovoltaica:
        response.periodoVeinteanalGeneracionFotovoltaica,
      periodoVeinteanalFlujoEnergia: response.periodoVeinteanalFlujoEnergia,
      periodoVeinteanalFlujoIngresosMonetarios:
        response.periodoVeinteanalFlujoIngresosMonetarios,
      ahorroUsd: this.ahorrosUsdCalcular(
        response.periodoVeinteanalFlujoIngresosMonetarios
      ),
      periodoVeinteanalEmisionesGEIEvitadas:
        response.periodoVeinteanalEmisionesGEIEvitadas,
      periodoVeinteanalProyeccionTarifas:
        response.periodoVeinteanalProyeccionTarifas,
      resultadosFinancieros: response.resultadosFinancieros,
    });
  }

  private ahorrosUsdCalcular(
    periodoVeinteanalFlujoIngresosMonetarios: FlujoIngresosMonetariosFront[]
  ) {
    const sumaAhorros = periodoVeinteanalFlujoIngresosMonetarios[0].ahorroEnElectricidadTotalUsd +
      periodoVeinteanalFlujoIngresosMonetarios[0].ingresoPorInyeccionElectricaUsd;


    this.sharedService.setAhorroAnualUsdPromedio(sumaAhorros);
    return sumaAhorros;
  }

  private checkUpdatePanelCapacity(newPanelCapacityW: number): void {
    if (newPanelCapacityW !== 400) {
      this.gmailService.sendEmailChangeCapacityInApi(newPanelCapacityW);
    }
  }
}
