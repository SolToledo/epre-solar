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

import { Subscription } from 'rxjs';
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
  @Input()
  periodoVeinteanalGeneracionFotovoltaica!: GeneracionFotovoltaicaFront[];
  @Input() consumoTotalAnual!: number;

  @ViewChild('emisionesChart')
  emisionesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ahorrosChart') ahorrosChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('energiaChart')
  energiaChartRef!: ElementRef<HTMLCanvasElement>;

  private subscription!: Subscription;
  recuperoInversionMeses!: number;
  carbonOffSet!: number;
  yearlyEnergy!: number;
  @Input() yearlyEnergyInitial!: number;
  porcentajeCubierto: number = 0;
  carbonOffSetInicialTon!: number;
  chartEnergia!: ApexCharts;
  emisionesChart!: ApexCharts;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.yearlyEnergyInitial = this.sharedService.getYearlyEnergyAcKwh();
    this.initializeChartEnergiaConsumo();
    this.sharedService.yearlyEnergyAcKwh$.subscribe({
      next: (yearly) => {
        this.yearlyEnergy = yearly;
        this.cdr.detectChanges();
        this.updateChartEnergiaConsumo();
      },
    });
    this.carbonOffSet = this.sharedService.getCarbonOffSetTnAnual();
    this.initializeChartEmisionesEvitadasAcumuladas();
    this.sharedService.CarbonOffSetTnAnual$.subscribe({
      next: (value) => {
        this.calculateEmisionesEvitadasConNuevoValor(value);

        // Actualiza el gráfico con los nuevos valores
        this.updateChartEmisionesEvitadasAcumuladas();

        // Detecta cambios en la vista si es necesario
        this.cdr.detectChanges();
      },
    });
  }

  // Función para recalcular el array con base en el nuevo valor de carbonOffSet
  private calculateEmisionesEvitadasConNuevoValor(nuevoCarbonOffSet: number) {
    // Clona el array original para no modificarlo directamente
    this.periodoVeinteanalEmisionesGEIEvitadasCopia = JSON.parse(
      JSON.stringify(this.periodoVeinteanalEmisionesGEIEvitadasOriginal)
    );

    // Obtén el valor original del primer año para calcular la proporción
    const valorOriginalPrimerAño =
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal[0].emisionesTonCO2;

    // Calcula la proporción de cambio
    const proporcion = nuevoCarbonOffSet / valorOriginalPrimerAño;

    // Aplica el nuevo valor y ajusta los valores restantes de manera proporcional
    this.periodoVeinteanalEmisionesGEIEvitadasCopia =
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal.map((item, index) => {
        return {
          ...item,
          emisionesTonCO2:
            index === 0 ? nuevoCarbonOffSet : item.emisionesTonCO2 * proporcion,
        };
      });
  }

  // Función para actualizar el gráfico con los nuevos valores
  private updateChartEmisionesEvitadasAcumuladas() {
    // Calcula los valores acumulados
    let acumulado = 0;
    const seriesData = this.periodoVeinteanalEmisionesGEIEvitadasCopia.map(
      (entry) => {
        acumulado += entry.emisionesTonCO2;
        return acumulado;
      }
    );

    // Extrae los años del array
    const categories = this.periodoVeinteanalEmisionesGEIEvitadasCopia.map(
      (entry) => entry.year.toString()
    );

    // Actualiza el gráfico con las nuevas opciones
    const options = {
      series: [
        {
          name: 'Emisiones CO₂ Acumuladas',
          data: seriesData,
        },
      ],
      chart: {
        height: 350,
        width: 470,
        type: 'area',
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
        width: 4,
      },
      fill: {
        colors: ['#96c0b2'],
        opacity: 0.05,
      },
      markers: {
        size: 0,
        hover: {
          size: 6,
          colors: ['#00754a'],
          strokeColor: '#00754a',
          strokeWidth: 2,
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
        },
      },
      yaxis: {
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
        marker: {
          show: true,
        },
        style: {
          fontSize: '12px',
          fontFamily: 'sodo sans, sans-serif',
        },
      },
    };

    if (this.emisionesChart) {
      this.emisionesChart.updateOptions(options);
    }
  }

  private initializeChartEmisionesEvitadasAcumuladas() {
    // Asegúrate de que periodoVeinteanalEmisionesGEIEvitadas está definido y no está vacío
    if (
      !this.periodoVeinteanalEmisionesGEIEvitadasOriginal ||
      this.periodoVeinteanalEmisionesGEIEvitadasOriginal.length === 0
    ) {
      console.error(
        'periodoVeinteanalEmisionesGEIEvitadas no está definido o está vacío'
      );
      return;
    }

    // Calcula los valores acumulados
    let acumulado = 0;
    const seriesData = this.periodoVeinteanalEmisionesGEIEvitadasOriginal.map(
      (entry) => {
        acumulado += entry.emisionesTonCO2; // Acumula las emisiones
        return acumulado;
      }
    );

    // Extrae los años del array
    const categories = this.periodoVeinteanalEmisionesGEIEvitadasOriginal.map(
      (entry) => entry.year.toString()
    );

    const options = {
      series: [
        {
          name: 'Emisiones CO₂ Acumuladas',
          data: seriesData,
        },
      ],
      chart: {
        height: 350,
        width: 470, // Establece el ancho a 470
        type: 'area',
        toolbar: {
          show: false, // Oculta la barra de herramientas
        },
        zoom: {
          enabled: false, // Desactiva el zoom
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        colors: ['#96c0b2'], // Color de la línea
        width: 4, // Hacer la línea un poco más gruesa
      },
      fill: {
        colors: ['#96c0b2'], // Color de la sombra
        opacity: 0.05, // Ajusta la opacidad de la sombra a un valor menor
      },
      markers: {
        size: 0, // Oculta todos los puntos
        hover: {
          size: 6, // Tamaño del punto cuando se muestra el tooltip
          colors: ['#00754a'], // Color del punto cuando se muestra el tooltip
          strokeColor: '#00754a', // Color del borde del punto cuando se muestra el tooltip
          strokeWidth: 2, // Ancho del borde del punto
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
        },
      },
      yaxis: {
        title: {
          text: 'Ton CO₂', // Título del eje Y con el 2 en subíndice
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
        marker: {
          show: true, // Muestra el marcador en el tooltip
        },
        style: {
          fontSize: '12px', // Tamaño de fuente del texto del tooltip
          fontFamily: 'sodo sans, sans-serif', // Tipografía del texto del tooltip
        },
      },
    };

    this.emisionesChart = new ApexCharts(
      document.querySelector('#emisionesChartRef') as HTMLElement,
      options
    );

    this.emisionesChart.render();
  }

  private initializeChartEnergiaConsumo() {
    const options = {
      chart: {
        height: 300,
        width: 470,
        type: 'bar',
        endingShape: 'rounded', // Offset vertical del contenedor padre
        background: 'transparent', // Color de fondo del gráfico
        foreColor: '#ccc', // Color del texto
        animations: {
          enabled: true, // Habilita/deshabilita animaciones
          easing: 'easeinout', // Tipo de efecto de transición
          speed: 800, // Velocidad de la animación
          animateGradually: {
            enabled: true,
            delay: 500,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
        toolbar: {
          show: false,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            customIcons: [],
          },
        },
        zoom: {
          enabled: false,
        },
      },

      series: [
        {
          name: 'Consumo Total Anual',
          data: [this.consumoTotalAnual],
          color: '#96c0b2',
        },
        {
          name: 'Generación Anual',
          data: [this.yearlyEnergy],
          color: '#e4c58d',
        },
      ],

      colors: ['#96c0b2', '#e4c58d'],

      plotOptions: {
        bar: {
          columnWidth: '55%', // Anchura de la columna
          distributed: false,
          horizontal: false, // Orientación horizontal o vertical
          endingShape: 'rounded', // Forma del final de la columna
          borderRadius: 4, // Radio de esquina de la columna
          barHeight: '100%', // Altura de la columna
        },
      },

      dataLabels: {
        enabled: true, // Muestra u oculta las etiquetas de datos
        formatter: function (val: any) {
          return val.toFixed(0);
        },
        textAnchor: 'middle', // Alineación horizontal del texto
        offsetX: 0, // Offset horizontal
        offsetY: -20, // Offset vertical
        style: {
          fontSize: '12px',
          colors: ['#fff'],
        },
      },

      legend: {
        show: true, // Muestra u oculta la leyenda
        position: 'bottom', // Posición de la leyenda
        horizontalAlign: 'left', // Alineación horizontal
        floating: false,
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 400,
        labels: {
          colors: '#000',
        },
        markers: {
          width: 8,
          height: 8,
          strokeWidth: 0,
          strokeColor: '#fff',
          fillColors: undefined,
          radius: 2,
          customHTML: undefined,
          onClick: undefined,
          offsetX: 0,
          offsetY: -2,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 0,
        },
        onItemClick: {
          toggleDataSeries: true,
        },
      },

      grid: {
        show: true, // Muestra u oculta la cuadrícula
        borderColor: '#f0f0f0', // Color del borde
        strokeDashArray: 0, // Estilo de línea discontinua
        xaxis: {
          lines: {
            show: true, // Muestra líneas horizontales
          },
        },
        yaxis: {
          lines: {
            show: true, // Muestra líneas verticales
          },
        },
        row: {
          colors: undefined, // Colores alternados para filas
          opacity: 0.5,
        },
        column: {
          colors: undefined, // Colores alternados para columnas
          opacity: 0.5,
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },

      yaxis: {
        title: {
          text: 'kWh',
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
      },

      xaxis: {
        type: 'category', // Tipo de eje (puede ser 'numeric' o 'datetime')
        categories: ['Consumo vs Generación'],
        labels: {
          show: true, // Muestra u oculta las etiquetas
          style: {
            colors: ['#424242', '#424242'],
            fontSize: '12px',
          },
          rotate: -45, // Rotación de las etiquetas
        },
      },
    };

    this.chartEnergia = new ApexCharts(
      document.querySelector('#chartEnergia') as HTMLElement,
      options
    );

    this.chartEnergia.render();
  }

  private updateChartEnergiaConsumo() {
    if (this.chartEnergia) {
      this.chartEnergia.updateOptions({
        series: [
          {
            name: 'Consumo Total Anual',
            data: [this.consumoTotalAnual],
          },
          {
            name: 'Generación Fotovoltaica Anual',
            data: [this.yearlyEnergy],
          },
        ],
      });
    }
  }

  private chartEmisionesEvitadasAcumuladas() {
    var options = {
      series: [
        {
          name: 'Emisiones CO₂',
          data: [31, 40, 28, 51, 42, 109, 100],
        },
      ],
      chart: {
        height: 350,
        width: 470, // Establece el ancho a 470
        type: 'area',
        toolbar: {
          show: false, // Oculta la barra de herramientas
        },
        zoom: {
          enabled: false, // Desactiva el zoom
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        colors: ['#96c0b2'], // Color de la línea
        width: 4, // Hacer la línea un poco más gruesa
      },
      fill: {
        colors: ['#96c0b2'], // Color de la sombra
        opacity: 0.05, // Ajusta la opacidad de la sombra a un valor menor
      },
      markers: {
        size: 0, // Oculta todos los puntos
        hover: {
          size: 6, // Tamaño del punto cuando se muestra el tooltip
          colors: ['#00754a'], // Color del punto cuando se muestra el tooltip
          strokeColor: '#00754a', // Color del borde del punto cuando se muestra el tooltip
          strokeWidth: 2, // Ancho del borde del punto
        },
      },
      xaxis: {
        categories: [
          '2025',
          '2026',
          '2027',
          '2028',
          '2029',
          '2030',
          '2031',
          '2032',
          '2033',
          '2034',
        ],
        title: {
          text: 'Año', // Título del eje X
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
      },
      yaxis: {
        title: {
          text: 'Ton CO₂', // Título del eje Y con el 2 en subíndice
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
          format: 'dd/MM/yy HH:mm',
        },
        marker: {
          show: true, // Muestra el marcador en el tooltip
        },
        style: {
          fontSize: '12px', // Tamaño de fuente del texto del tooltip
          fontFamily: 'sodo sans, sans-serif', // Tipografía del texto del tooltip
        },
      },
    };

    var chart = new ApexCharts(document.querySelector('#chart'), options);

    chart.render();
  }

  chartAhorroRecupero() {
    var options = {
      series: [
        {
          name: 'Ahorro por autoconsumo de energía',
          data: [45, 52, 38, 24, 33, 26],
        },
        {
          name: 'Ingreso por excedentede energía',
          data: [35, 41, 62, 42, 13, 18],
        },
      ],

      chart: {
        height: 300,
        width: 470,
        type: 'line',
        toolbar: {
          show: false, // Oculta la barra de herramientas
        },
        zoom: {
          enabled: false, // Desactiva el zoom
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 5,
        curve: 'straight',
        dashArray: [0, 0], // Ajusta el dashArray según las líneas que mantengas
      },
      colors: [
        '#96c0b2', // Color para la primera línea
        '#e4c58d', // Color para la segunda línea
      ],
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6,
        },
      },
      xaxis: {
        labels: {
          trim: false,
        },
        categories: [
          '01 Jan',
          '02 Jan',
          '03 Jan',
          '04 Jan',
          '05 Jan',
          '06 Jan',
        ],
        type: 'datetime',
        title: {
          text: 'Años', // Título del eje X
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
      },
      yaxis: {
        title: {
          text: 'USD', // Título del eje Y
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
        enabled: false, // Desactiva el tooltip
      },
      annotations: {
        xaxis: [
          {
            x: new Date('04 Jan').getTime(), // Ajusta la fecha según lo necesario
            strokeDashArray: 0,
            borderColor: '#00754a',
            label: {
              borderColor: '#00754a',
              style: {
                color: '#fff',
                background: '#00754a',
              },
              text: 'Momento de recupero',
            },
          },
        ],
      },
    };

    var chart = new ApexCharts(
      document.querySelector('#chartAhorroRecupero'),
      options
    );

    chart.render();
  }

  //GRAFICOS

  ngOnDestroy(): void {}
}
