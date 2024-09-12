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
  ) {}

  ngOnInit(): void {
    this.sharedService.yearlyEnergyAcKwh$.subscribe({
      next: (yearlyEnergy) => {
        this.yearlyEnergy = yearlyEnergy;
        if (this.chartSolLuna) this.updateChartEnergiaConsumo();
        if (this.chartAhorroRecupero) this.updateChartAhorroRecupero();
        if (this.chartAhorroRecupero) this.updateChartAhorroRecupero();
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

    console.log('ahorroData:', ahorroData);
    console.log('ingresoData:', ingresoData);
    console.log('categories:', categories);
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
      xaxis: {
        categories: categories,
        title: {
          text: 'Años',
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
          offsetY: -25,
        },
      },
      yaxis: {
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

      annotations: {
        xaxis: [
          {
            x: anoRecuperoInversion.toString(),
            strokeDashArray: 5, // Estilo de línea de puntos (valor mayor para más puntos)
            borderColor: '#008ae3', // Color celeste oscuro
            borderWidth: 2, // Aumenta el espesor de la línea
            showInLegend: true,
          },
          
        ],
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
          data: [0], // Solo un punto para mostrar en la leyenda
          color: '#008ae3', // Color del punto en la leyenda
          showInLegend: true,
          type: 'line', // Tipo de línea
          stroke: {
            width: 0, // No trazar ninguna línea
          },

          tooltip: {
            enabled: true,
            theme: 'light',
            y: {
              formatter: (val: number) => {
                const valorTruncado = Math.floor(val); // Redondear hacia abajo para quitar los decimales
                return valorTruncado.toLocaleString('de-DE'); // Formatear con puntos de miles
              },
            },
          },
          plotOptions: {
            line: {
              colors: ['transparent'], // Línea invisible
            },
          },
        },
      ],
      chart: {
        height: 300,
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
          colors: {
            backgroundBarOpacity: 0.3, // Ajustar la opacidad del fondo de las barras
          },
        },
      },
      xaxis: {
        categories: ['Consumo total anual', 'Generación Anual'], // Etiquetas en el eje X
        labels: {
          show: true, // Mostrar etiquetas del eje X
          style: {
            colors: ['#6d6b6b'], // Color para las etiquetas del eje X
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
      },
      yaxis: {
        title: {
          text: 'kWh', // Cambiar el texto del título del eje Y a "kWh"
          style: {
            fontSize: '14px',
            fontFamily: 'sodo sans, sans-serif',
            color: '#6d6b6b',
          },
        },
        labels: {
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE'); // Formato para valores en el eje Y (kWh)
          },
          style: {
            colors: ['#6d6b6b'],
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
            return `${val.toLocaleString('de-DE')} kWh`; // Formato del valor en el tooltip
          },
        },
      },
      grid: {
        borderColor: '#f1f1f1',
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
        toolbar: {
          show: false, // Oculta la barra de herramientas
        },
        zoom: {
          enabled: false, // Desactiva el zoom
        },
      },
      legend: {
        show: true, // Mostrar la leyenda
        position: 'top', // Puedes cambiar la posición ('top', 'bottom', 'left', 'right')
        horizontalAlign: 'left', // Alinear la leyenda horizontalmente
        fontSize: '14px', // Tamaño del texto de la leyenda
        labels: {
          useSeriesColors: true, // Usa el color de la serie en la leyenda
        },
      },

      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        colors: ['#96c0b2'], // Color de la línea
        width: 3, // Hacer la línea un poco más gruesa
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          gradientToColors: ['#e4c58d'], // Color final del degradado (amarillo)
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
          text: 'Año', // Título del eje X
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
          offsetY: -15, // Ajusta el valor para acercar el título al gráfico
        },
      },
      yaxis: {
        labels: {
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE');
          },
        },
        title: {
          text: 'Ton CO₂', // Título del eje Y
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
      },
      tooltip: {
        enabled: true, // Habilita el tooltip
        theme: 'light', // Tema del tooltip (dark o light)
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
          show: false, // Muestra el marcador en el tooltip
        },
        style: {
          fontSize: '12px', // Tamaño de fuente del texto del tooltip
          fontFamily: 'sodo sans, sans-serif', // Tipografía del texto del tooltip
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

    console.log(
      'Array recalculado:',
      this.periodoVeinteanalEmisionesGEIEvitadasCopia
    );
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
