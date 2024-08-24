import { EmisionesGeiEvitadasFront } from "./emisiones-gei-evitadas-front";
import { FlujoEnergiaFront } from "./flujo-energia-front";
import { FlujoIngresosMonetariosFront } from "./flujo-ingresos-monetarios-front";
import { GeneracionFotovoltaicaFront } from "./generacion-fotovoltaica-front";
import { ProyeccionTarifasFront } from "./proyeccion-tarifas-front";
import { Resultados } from "./resultados";
import { SolarDataFront } from "./solar-data-front";

export interface ResultadosFrontDTO {
  solarData: SolarDataFront;
  periodoVeinteanalGeneracionFotovoltaica: GeneracionFotovoltaicaFront[];
  periodoVeinteanalFlujoEnergia: FlujoEnergiaFront[];
  periodoVeinteanalFlujoIngresosMonetarios: FlujoIngresosMonetariosFront[];
  ahorroUsdPromedio: number;
  periodoVeinteanalEmisionesGEIEvitadas: EmisionesGeiEvitadasFront[];
  periodoVeinteanalProyeccionTarifas: ProyeccionTarifasFront[];
  resultadosFinancieros: {
    casoConCapitalPropio: any[],
    indicadoresFinancieros: any

  };
}
