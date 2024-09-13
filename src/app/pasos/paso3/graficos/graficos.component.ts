import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';

import { Subject, takeUntil } from 'rxjs';
import { EmisionesGeiEvitadasFront } from 'src/app/interfaces/emisiones-gei-evitadas-front';
import { FlujoEnergiaFront } from 'src/app/interfaces/flujo-energia-front';
import { FlujoIngresosMonetariosFront } from 'src/app/interfaces/flujo-ingresos-monetarios-front';
import { GeneracionFotovoltaicaFront } from 'src/app/interfaces/generacion-fotovoltaica-front';
import { SharedService } from 'src/app/services/shared.service';
import * as ApexCharts from 'apexcharts';

@Component({
  selector: 'app-graficos',
  templateUrl: './graficos.component.html',
  styleUrls: ['./graficos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficosComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  periodoVeinteanalEmisionesGEIEvitadasOriginal!: EmisionesGeiEvitadasFront[];
  periodoVeinteanalEmisionesGEIEvitadasCopia: EmisionesGeiEvitadasFront[] = [];
  @Input() periodoVeinteanalFlujoEnergia!: FlujoEnergiaFront[];
  @Input()
  periodoVeinteanalFlujoIngresosMonetarios!: FlujoIngresosMonetariosFront[];
  periodoVeinteanalFlujoIngresosMonetariosCopia: FlujoIngresosMonetariosFront[] =
    [];
  @Input()
  periodoVeinteanalGeneracionFotovoltaica!: GeneracionFotovoltaicaFront[];
  @Input() consumoTotalAnual!: number;

  @ViewChild('emisionesChartRef')
  emisionesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartSolLunaRef')
  chartSolLunaRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartAhorroRecuperoRef')
  chartAhorroRecuperoRef!: ElementRef<HTMLCanvasElement>;

  recuperoInversionMeses!: number;
  carbonOffSet!: number;
  yearlyEnergy!: number;
  @Input() yearlyEnergyInitial!: number;
  porcentajeCubierto: number = 0;
  carbonOffSetInicialTon!: number;
  chartEnergia!: ApexCharts;
  chartSolLuna!: ApexCharts;
  emisionesChart!: ApexCharts;
  chartAhorroRecupero!: ApexCharts;
  mesesRecupero!: number;
  private destroy$ = new Subject<void>(); // Subject para manejar desuscripciones

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.sharedService.yearlyEnergyAckWh$.subscribe({
      next: (yearlyEnergy) => {
        this.yearlyEnergy = yearlyEnergy;
        if (this.chartSolLuna) this.updateChartEnergiaConsumo();
        if (this.chartAhorroRecupero) this.updateChartAhorroRecupero();
        // if (this.chartAhorroRecupero) this.updateChartAhorroRecupero();
      },
    });
  }

  ngAfterViewInit(): void {
    this.initializeGraficoSolLuna();
    this.initializeChartAhorroRecupero();
    this.initializeChartEmisionesEvitadasAcumuladas();
  }

  ngOnDestroy(): void {
    // Emitir un valor para cerrar las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeChartAhorroRecupero() {
    this.periodoVeinteanalFlujoIngresosMonetariosCopia = JSON.parse(
      JSON.stringify(this.periodoVeinteanalFlujoIngresosMonetarios)
    );

    const recuperoInversionMeses = this.sharedService.getPlazoInversionValue();
    const recuperoInversionAnios = Math.round(recuperoInversionMeses / 12);
    const primerAno =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia[0].year;
    const anoRecuperoInversion = primerAno + recuperoInversionAnios;

    // Calcular los valores promedio
    const cantPeriodos =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia.length;

    const promedioAhorro =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia.reduce(
        (sum, item) => sum + item.ahorroEnElectricidadTotalUsd,
        0
      ) / cantPeriodos;
    const promedioIngreso =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia.reduce(
        (sum, item) => sum + item.ingresoPorInyeccionElectricaUsd,
        0
      ) / cantPeriodos;

    // Crear arrays con los valores promedio repetidos para cada año
    const ahorroData = Array(cantPeriodos).fill(promedioAhorro);
    const ingresoData = Array(cantPeriodos).fill(promedioIngreso);

    const categories = this.periodoVeinteanalFlujoIngresosMonetariosCopia.map(
      (item) => item.year.toString()
    );




const options = {
  series: [
    {
      name: 'Ahorro por autoconsumo de energía',
      data: ahorroData,
      color: '#96c0b2',
    },
    {
      name: 'Ingreso por excedente de energía',
      data: ingresoData,
      color: '#e4c58d',
    },
    {
      name: 'Punto de recupero',
      data: [''], 
      color: '#008ae3',
    }
  ],
  chart: {
    height: 350,
    width: 470,
    type: 'line',
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
  },
  stroke: {
    curve: 'smooth',
    colors: ['#96c0b2', '#e4c58d', '#008ae3'],
    width: 3,
  },
  xaxis: {
    categories: categories,
    title: {
      text: 'Año',
      style: {
        fontSize: '12px',
        fontFamily: 'sodo sans, sans-serif',
      },
      offsetY: -25,
    },
  },
  yaxis: {
    min: 0,
    labels: {
      formatter: (val: number): string => {
        return val.toLocaleString('de-DE');
      },
    },
    title: {
      text: 'USD',
      style: {
        fontSize: '12px',
        fontFamily: 'sodo sans, sans-serif',
      },
    },
  },
  tooltip: {
    enabled: true,
    theme: 'light',
    y: {
      formatter: (val: number) => {
        const valorTruncado = Math.floor(val);
        return `${valorTruncado.toLocaleString('de-DE')} USD/año`;
      },
    },
  },
  annotations: {
    xaxis: [
      {
        x: anoRecuperoInversion.toString(),
        strokeDashArray: 5,
        borderColor: '#008ae3',
        borderWidth: 2,
        showInLegend: true,
      },
    ],
  },
  legend: {
    markers: {
      width: 30,
      height: 3,
      strokeWidth: 3,
      shape: 'line',
      radius: 0,
    },
    position: 'bottom',
    formatter: (seriesName: string, opts: any) => {
      // Personaliza la leyenda con margen de 4px entre la línea y el texto
      if (seriesName === 'Punto de recupero') {
        return `<span style="display: inline-block; width: 30px; height: 3px; border-top: 2px dashed #008ae3; margin-right: 4px;"></span>${seriesName}`;
      }
      return `<span style="display: inline-block; width: 30px; height: 3px; background-color: ${opts.w.globals.colors[opts.seriesIndex]}; margin-right: 4px;"></span>${seriesName}`;
    }
  },
};


    // Renderiza el gráfico
    this.chartAhorroRecupero = new ApexCharts(
      document.querySelector('#chartAhorroRecuperoRef') as HTMLElement,
      options
    );
    this.chartAhorroRecupero.render();
    this.cdr.detectChanges();
  }

  private updateChartAhorroRecupero() {
    if (!this.chartAhorroRecupero) {
      console.error('El gráfico no está inicializado.');
      return;
    }
    const recuperoInversionMeses = this.sharedService.getPlazoInversionValue();
    // Obtener el valor actualizado de los meses y calcular el año de recupero
    const recuperoInversionAnios = Math.round(recuperoInversionMeses / 12);
    const primerAno =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia[0].year;
    const anoRecuperoInversion = primerAno + recuperoInversionAnios;

    // Actualizar la anotación del año de recupero
    const updatedAnnotations = {
      xaxis: [
        {
          x: anoRecuperoInversion.toString(),
          strokeDashArray: 5, // Estilo de línea de puntos
          borderColor: '#008ae3', // Color celeste oscuro
          borderWidth: 2, // Grosor de la línea
        },
      ],
    };

    // Calcular los valores promedio
    const cantPeriodos =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia.length;

    const promedioAhorro =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia.reduce(
        (sum, item) => sum + item.ahorroEnElectricidadTotalUsd,
        0
      ) / cantPeriodos;
    const promedioIngreso =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia.reduce(
        (sum, item) => sum + item.ingresoPorInyeccionElectricaUsd,
        0
      ) / cantPeriodos;

    // Crear arrays con los valores promedio repetidos para cada año
    const ahorroData = Array(cantPeriodos).fill(promedioAhorro);
    const ingresoData = Array(cantPeriodos).fill(promedioIngreso);

    // Actualizar los datos y las anotaciones en el gráfico
    this.chartAhorroRecupero.updateOptions({
      series: [
        {
          name: 'Ahorro por autoconsumo de energía',
          data: ahorroData,
          color: '#96c0b2',
        },
        {
          name: 'Ingreso por excedente de energía',
          data: ingresoData,
          color: '#e4c58d',
        },
        {
          name: 'Punto de recupero',
          data: [''], 
          color: '#008ae3', 
        }
      ],
      chart: {
        height: 350,
        width: 470,
        type: 'line', // Tipo de gráfico general
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      stroke: {
        curve: 'smooth',
        colors: ['#96c0b2', '#e4c58d'], // Colores de las líneas reales
        width: 3, // Grosor de las líneas
      },
      yaxis: {
        min: 0, // Asegura que el eje Y comience desde 0
        labels: {
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE');
          },
        },
        title: {
          text: 'USD',
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
      },
      grid: {
        borderColor: '#f1f1f1',
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        y: {
          formatter: (val: number) => {
            const valorTruncado = Math.floor(val); // Redondear hacia abajo para quitar los decimales
            return `${valorTruncado.toLocaleString('de-DE')} USD/año`; // Formatear con puntos de miles y agregar el texto
          },
        },
      },
      annotations: updatedAnnotations,
    });

    // Forzar la detección de cambios si es necesario
    this.cdr.detectChanges();
  }

  /* Metodo para inicializar el grafico Sol-Luna */
  private initializeGraficoSolLuna() {
    const options = {
      chart: {
        type: 'bar',
        height: 350,
        width: 470,
        endingShape: 'rounded',
        background: 'transparent',
        toolbar: {
          show: false, // Eliminar el menú del gráfico
        },
      },
      series: [
        {
          data: [this.consumoTotalAnual, this.yearlyEnergy],
          name: 'Valores',
        },
      ],
      colors: ['#96c0b2', '#e4c58d'], // Colores para las barras
      plotOptions: {
        bar: {
          columnWidth: '50%',
          distributed: true, // Diferenciar colores entre las barras
        },
      },
      xaxis: {
        categories: ['Consumo total anual', 'Generación Anual'], // Etiquetas en el eje X
        labels: {
          show: false, // Ocultar las etiquetas del eje X
        },
      },
      yaxis: {
        min: 0, // Asegura que el eje Y comience desde 0
        title: {
          text: 'kWh', // Mostrar "kWh" como título del eje Y
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
        labels: {
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE'); // Formato para valores en el eje Y
          },
        },
      },
      dataLabels: {
        enabled: true, // Habilitar los datos dentro de las columnas
        style: {
          colors: ['#6d6b6b'], // Cambiar el color del texto a gris
          fontSize: '10px', // Tamaño de letra más pequeño que el predeterminado
          fontFamily: 'inherit', // Mantener la fuente predeterminada
        },
        formatter: (val: number): string => {
          // Formatear el valor para mostrar con puntos de miles y sin decimales
          return val.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        },
      },
      tooltip: {
        enabled: true,
        theme: 'light',
        y: {
          formatter: (val: number) => {
            // Formatear el valor para mostrar con puntos de miles y sin decimales
            return val.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: ['#96c0b2', '#e4c58d'], // Colores de gradiente para cada columna
          shadeIntensity: 1,
          type: 'vertical', // Orientación vertical del gradiente
          opacityFrom: 1, // Opacidad completa en la parte superior
          opacityTo: 0.5, // Opacidad parcial (transparente) en la parte inferior
          stops: [0, 100], // Inicio y fin del gradiente
        },
      },
    };
    
  
    // Renderizar el gráfico Sol-Luna
    this.chartSolLuna = new ApexCharts(
      document.querySelector('#chartSolLunaRef') as HTMLElement,
      options
    );
    this.chartSolLuna.render();
    this.cdr.detectChanges(); // Forzar detección de cambios en Angular
  }

  private updateChartEnergiaConsumo() {
    if (this.chartSolLuna) {
      this.chartSolLuna.updateOptions(
        {
          series: [
            {
              data: [this.consumoTotalAnual, this.yearlyEnergy],
              name: [' valor'],
            },
          ],
        },
        false,
        false
      ); // Los dos últimos parámetros indican que no se debe sobrescribir toda la configuración ni redibujar el gráfico completo
      this.cdr.detectChanges();
    }
  }

  private initializeChartEmisionesEvitadasAcumuladas() {
    if (
      !this.periodoVeinteanalEmisionesGEIEvitadasOriginal ||
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal.length === 0
    ) {
      console.error(
        'periodoVeinteanalEmisionesGEIEvitadasOriginal no está definido o está vacío'
      );
      return;
    }

    // Añadir el punto inicial en 0 para el primer año
    const modifiedData = [
      { year: 2024, emisionesTonCO2: 0 },
      ...this.periodoVeinteanalEmisionesGEIEvitadasOriginal,
    ];

    // Calcula las diferencias y simula la degradación
    const seriesData = modifiedData
      .map((item, index, array) => {
        let prevItem;
        index === 0 ? (prevItem = array[index]) : (prevItem = array[index - 1]);
        const degradacion = 0.004;
        const emisionesReducidas =
          prevItem.emisionesTonCO2 - prevItem.emisionesTonCO2 * degradacion;
        return {
          year: item.year,
          diferencia: emisionesReducidas,
        };
      })
      .filter(
        (item): item is { year: number; diferencia: number } => item !== null
      );

    // Inicializa el acumulado con el valor de emisiones del primer año
    let acumulado = 0; // Comienza en cero

    // Calcula el acumulado sumando las diferencias
    const acumuladoData = seriesData.map((item) => {
      acumulado += item.diferencia;
      return {
        year: item.year,
        acumulado: acumulado,
      };
    });

    // Extrae los años y el acumulado para el gráfico
    const categories = acumuladoData
      .filter((d) => d && typeof d.year !== 'undefined')
      .map((d) => d.year.toString());
    const data = modifiedData.map((d) => d.emisionesTonCO2);

    // Configura el gráfico
    const options = {
      series: [
        {
          name: 'Emisiones CO₂ Acumuladas',
          data: data,
          color: '#96c0b2',
        },
      ],
      chart: {
        height: 350,
        width: 470,
        type: 'area',
        className: 'chart-specific-1',
        toolbar: {
          show: false, 
        },
        zoom: {
          enabled: false, 
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        colors: ['#96c0b2'], 
        width: 3, 
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: ['#e4c58d'], 
          shadeIntensity: 0.8,
          type: 'vertical',
          opacityFrom: 0.8,
          opacityTo: 0.3,
          stops: [0, 100, 100, 100],
        },
      },
      markers: {
        size: 0,
        colors: ['#96c0b2'],
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: {
          size: 7,
        },
      },
      xaxis: {
        categories: categories,
        title: {
          text: 'Año', 
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
          offsetY: -25, // Ajusta la distancia entre el texto "Año" y el gráfico
        },
      },
      yaxis: {
        min:0,
        labels: {
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE');
          },
        },
        title: {
          text: 'Ton CO₂', 
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
      },
      
      tooltip: {
        enabled: true, 
        theme: 'light', 
        x: {
          format: 'yyyy',
        },
        y: {
          formatter: (value: number) => {
            return `${value.toLocaleString('de-DE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} tCO₂/año`;
          },
        },
        marker: {
          show: false, 
        },
        style: {
          fontSize: '12px', 
          fontFamily: 'sodo sans, sans-serif', 
        },
      },
    };
    

    // Inicializa y renderiza el gráfico
    this.emisionesChart = new ApexCharts(
      document.querySelector('#emisionesChartRef') as HTMLElement,
      options
    );

    this.emisionesChart.render();
  }

  private calculateEmisionesEvitadasConNuevoValor(
    nuevoCarbonOffSet: number
  ): void {
    if (
      !this.periodoVeinteanalEmisionesGEIEvitadasOriginal ||
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal.length === 0
    ) {
      console.error(
        'periodoVeinteanalEmisionesGEIEvitadasOriginal no está definido o está vacío'
      );
      return;
    }

    // Factor de ajuste en base al nuevo valor de CarbonOffSetTnAnual
    const factorDeAjuste = nuevoCarbonOffSet / this.carbonOffSetInicialTon;

    // Recalcula el array de emisiones evitadas con el nuevo valor
    this.periodoVeinteanalEmisionesGEIEvitadasCopia =
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal.map((item) => {
        return {
          ...item,
          emisionesTonCO2: item.emisionesTonCO2 * factorDeAjuste,
        };
      });

    
  }

  private updateChartEmisionesEvitadasAcumuladas(): void {
    // Añadir el punto inicial en 0 para el primer año
    const modifiedData = [
      { year: 2024, emisionesTonCO2: 0 },
      ...this.periodoVeinteanalEmisionesGEIEvitadasCopia,
    ];

    // Calcula las diferencias y simula la degradación
    const seriesData = modifiedData
      .map((item, index, array) => {
        let prevItem;
        index === 0 ? (prevItem = array[index]) : (prevItem = array[index - 1]);
        const degradacion = 0.004; // Simula la degradación anual
        const emisionesReducidas =
          prevItem.emisionesTonCO2 - prevItem.emisionesTonCO2 * degradacion;
        return {
          year: item.year,
          diferencia: emisionesReducidas,
        };
      })
      .filter(
        (item): item is { year: number; diferencia: number } => item !== null
      );

    // Inicializa el acumulado con el valor de emisiones del primer año
    let acumulado = 0; // Comienza en cero

    // Calcula el acumulado sumando las diferencias
    const acumuladoData = seriesData.map((item) => {
      acumulado += item.diferencia;
      return {
        year: item.year,
        acumulado: acumulado,
      };
    });

    // Extrae los años y el acumulado para el gráfico
    const categories = acumuladoData
      .filter((d) => d && typeof d.year !== 'undefined')
      .map((d) => d.year.toString());

    const data = modifiedData.map((d) => d.emisionesTonCO2);

    // Actualiza el gráfico con los nuevos datos
    this.emisionesChart.updateOptions({
      series: [
        {
          name: 'Emisiones CO₂ Acumuladas',
          data: data,
          color: '#96c0b2',
        },
      ],
      xaxis: {
        categories: categories,
      },
    });
  }
}
