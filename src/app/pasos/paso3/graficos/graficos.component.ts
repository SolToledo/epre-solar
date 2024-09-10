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

import { Subject, Subscription, takeUntil } from 'rxjs';
import { EmisionesGeiEvitadasFront } from 'src/app/interfaces/emisiones-gei-evitadas-front';
import { FlujoEnergiaFront } from 'src/app/interfaces/flujo-energia-front';
import { FlujoIngresosMonetariosFront } from 'src/app/interfaces/flujo-ingresos-monetarios-front';
import { GeneracionFotovoltaicaFront } from 'src/app/interfaces/generacion-fotovoltaica-front';
import { SharedService } from 'src/app/services/shared.service';
import * as ApexCharts from 'apexcharts';
import { color } from 'html2canvas/dist/types/css/types/color';

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


  chartSolLuna: any;  // Declaración de la propiedad/******************************************************************************************************* */

  private subscription!: Subscription;
  recuperoInversionMeses!: number;
  carbonOffSet!: number;
  yearlyEnergy!: number;
  @Input() yearlyEnergyInitial!: number;
  porcentajeCubierto: number = 0;
  carbonOffSetInicialTon!: number;
  chartEnergia!: ApexCharts;
  emisionesChart!: ApexCharts;
  chartAhorroRecupero!: ApexCharts;
  mesesRecupero!: number;
  private isUpdating: boolean = false;
  private destroy$ = new Subject<void>(); // Subject para manejar desuscripciones

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.yearlyEnergyInitial = this.sharedService.getYearlyEnergyAcKwh();

    this.sharedService.yearlyEnergyAcKwh$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (yearly) => {
          this.yearlyEnergy = yearly;
          this.cdr.detectChanges();
          this.updateChartEnergiaConsumo();
          this.updateChartAhorroRecupero();
        },
      });

    this.sharedService.plazoInversion$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mesesRecupero) => {
        this.mesesRecupero = mesesRecupero;
        this.updateChartAhorroRecupero();
      });

    this.carbonOffSet = this.sharedService.getCarbonOffSetTnAnual();

    this.sharedService.CarbonOffSetTnAnual$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (value) => {
        this.calculateEmisionesEvitadasConNuevoValor(value);
        this.updateChartEmisionesEvitadasAcumuladas();
        this.cdr.detectChanges();
      },
    });
    this.initializeChartAhorroRecupero();
    this.initializeGraficoSolLuna()
    // this.initializeChartEnergiaConsumo();
    this.initializeChartEmisionesEvitadasAcumuladas();
    this.cdr.detectChanges();


  }

  ngOnDestroy(): void {
    // Emitir un valor para cerrar las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
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
/************************************************************************************************************************************************************** */
  // Función para actualizar el gráfico con los nuevos valores
  private initializeChartEmisionesEvitadasAcumuladas() {
    // Asegúrate de que periodoVeinteanalEmisionesGEIEvitadasOriginal está definido y no está vacío
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
        index===0? prevItem = array[index]: prevItem = array[index - 1];
        const degradacion = 0.004; 
        const emisionesReducidas =
          prevItem.emisionesTonCO2 - (prevItem.emisionesTonCO2 * degradacion);
          console.log("prevItem.emisionesTonCO2 - (prevItem.emisionesTonCO2 * degradacion) ", emisionesReducidas)
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

    console.log('data ', modifiedData);
    // Configura el gráfico
    const options = {
      series: [
        {
          name: 'Emisiones CO₂ Acumuladas',
          data: data,
          color:'#96c0b2',
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
          gradientToColors: ['#e4c58d'],// Color final del degradado (amarillo)
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
          offsetY: -25, // Ajusta el valor para acercar el título al gráfico
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
            return `${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tCO₂/año`;
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
/************************************************************************************************************************************************************** */
 
private initializeChartEnergiaConsumo() {
    const options = {
      chart: {
        height: 300,
        width: 470,
        type: 'bar',
        endingShape: 'rounded', 
        background: 'transparent', 
        foreColor: '#ccc', 
        animations: {
          enabled: true, 
          easing: 'easeinout', 
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
          /*name: 'Consumo Total Anual',*/
          data: [this.consumoTotalAnual, this.yearlyEnergy],
          /*color: '#96c0b2',*/
        },
       /* {
          name: 'Generación Anual',
          data: [this.yearlyEnergy],
          color: '#e4c58d',
        },*/
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
          /*fontSize: '12px',
          colors: ['#fff'],*/
          fontSize: '12px',
          fontFamily: 'sodo sans, sans-serif',
         
        },
      },

      legend: {
        show: true, // Muestra u oculta la leyenda
        position: 'bottom', // Posición de la leyenda
        horizontalAlign: 'left', // Alineación horizontal
        floating: false,
        labels: {
          colors: '#000',
        },
        markers: {
          width: 8,
          height: 8,
          strokeWidth: 0,
         /* strokeColor: '#fff',
          fillColors: undefined,*/
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
        labels: {
          style: {
            colors: '#333333', // Cambia el color a un tono más oscuro para los números del eje Y
            fontSize: '10px',
          },
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE'); // Formatea el número con punto como separador de miles
          },
        },
        title: {
          text: 'kWh', // Título del eje Y
          style: {
            color: '#333333', // Cambia el color a un tono más oscuro para el título
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
        },
      },
   
      xaxis: {
        type: 'category', // Tipo de eje (puede ser 'numeric' o 'datetime')
        categories: [' '],
        labels: {
          show: true, // Muestra u oculta las etiquetas
          style: {
            colors: ['#424242', '#424242'],
            fontSize: '12px',
          },
          rotate: -45, // Rotación de las etiquetas
        },
        offsetY: -25, // Ajusta el valor para acercar el título al gráfico
      },
    };

    this.chartEnergia = new ApexCharts(
      document.querySelector('#chartEnergiaRef') as HTMLElement,
      options
    );
    console.log('Instancia de ApexCharts:', this.chartEnergia);
    this.chartEnergia.render();
  }
/**************************************************************************************************************************************************************** */
  private initializeChartAhorroRecupero() {
    this.periodoVeinteanalFlujoIngresosMonetariosCopia = JSON.parse(
      JSON.stringify(this.periodoVeinteanalFlujoIngresosMonetarios)
    );

    const recuperoInversionMeses = this.sharedService.getPlazoInversionValue();
    const recuperoInversionAnios = Math.round(recuperoInversionMeses / 12);
    const primerAno =
      this.periodoVeinteanalFlujoIngresosMonetariosCopia[0].year;
    const anoRecuperoInversion = primerAno + recuperoInversionAnios;

    const ahorroData = this.periodoVeinteanalFlujoIngresosMonetariosCopia.map(
      (item) => item.ahorroEnElectricidadTotalUsd
    );
    const ingresoData = this.periodoVeinteanalFlujoIngresosMonetariosCopia.map(
      (item) => item.ingresoPorInyeccionElectricaUsd
    );

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
          data: [0], // Solo un punto para mostrar en la leyenda
          color: '#008ae3', // Color del punto en la leyenda
          showInLegend: true,
          type: ' ', // Tipo de línea
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
              }
            }
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
/*************************************************************************************************************************************************************** */  

  private updateChartEmisionesEvitadasAcumuladas() {
    // Calcula los valores acumulados
    const seriesData = this.periodoVeinteanalEmisionesGEIEvitadasCopia
      .map((item, index, array) => {
        if (index === 0) return null;

        const prevItem = array[index - 1];
        return {
          year: item.year,
          diferencia: prevItem.emisionesTonCO2 - item.emisionesTonCO2,
        };
      })
      .filter((item) => item !== null);

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
        curve: 'straight',
        colors: ['#008ae3'],
        width: 4,
      },
      fill: {
        colors: ['#008ae3'],
        opacity: 0.05,
      },
      markers: {
        size: 0,
        hover: {
          size: 6,
          colors: ['#008ae3'],
          strokeColor: '#008ae3',
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
        labels: {
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE'); // Formatea el número con punto como separador de miles
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

  private updateChartAhorroRecupero() {
    if (this.isUpdating) return; // Evitar llamada infinita recursiva
    this.isUpdating = true;
    // Recalcula los valores si cambia yearlyEnergy (opcional, según lógica que implementes)
    this.recalculateFlujoIngresosMonetarios(this.yearlyEnergy);

    // Actualiza los datos del gráfico
    const ahorroData = this.periodoVeinteanalFlujoIngresosMonetariosCopia.map(
      (item) => item.ahorroEnElectricidadTotalUsd
    );
    const ingresoData = this.periodoVeinteanalFlujoIngresosMonetariosCopia.map(
      (item) => item.ingresoPorInyeccionElectricaUsd
    );

    // Actualiza el gráfico con las nuevas opciones
    if (this.chartAhorroRecupero) {
      this.chartAhorroRecupero.updateOptions({
        series: [
          {
            name: 'Ahorro por autoconsumo de energía',
            data: ahorroData,
          },
          {
            name: 'Ingreso por excedente de energía',
            data: ingresoData,
          },
        ],

        annotations: {
          xaxis: [
            {
              x: new Date(this.recuperoInversionMeses).getTime(), // Actualiza la anotación de recupero de inversión
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
      });
    }
    this.isUpdating = false;
  }

  // Método para recalcular los valores del flujo de ingresos monetarios
  private recalculateFlujoIngresosMonetarios(yearlyEnergy: number): void {
    if (this.isUpdating) return;
    this.isUpdating = true;
    // Itera sobre la copia del array y ajusta los valores basados en el nuevo yearlyEnergy
    this.periodoVeinteanalFlujoIngresosMonetariosCopia.forEach(
      (item, index) => {
        const factor = yearlyEnergy / this.yearlyEnergyInitial; // tienes el valor original almacenado
        item.ahorroEnElectricidadTotalUsd =
          this.periodoVeinteanalFlujoIngresosMonetarios[index]
            .ahorroEnElectricidadTotalUsd * factor;
        item.ingresoPorInyeccionElectricaUsd =
          this.periodoVeinteanalFlujoIngresosMonetarios[index]
            .ingresoPorInyeccionElectricaUsd * factor;
      }
    );

    // Actualiza el gráfico con los nuevos valores recalculados
    this.updateChartAhorroRecupero();
    this.isUpdating = false;
  }



/* metodo reemplazado por Sol */
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
        name: [' valor'],
      },
    ],
    colors: ['#96c0b2', '#e4c58d'], // Colores para las barras
    plotOptions: {
      bar: {
        columnWidth: '50%',
        distributed: true, // Diferenciar colores entre las barras
        colors: {
          backgroundBarOpacity: 0.3, // Ajustar la opacidad del fondo de las barras (más transparente)
        },
      },
    },
    xaxis: {
      categories: ['Consumo total anual', 'Generación Anual'], // Etiquetas en el eje X (pero ocultas)
      labels: {
        show: false, // Ocultar las etiquetas del eje X
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
          return val.toLocaleString('de-DE'); // Formateo de separador de miles
        },
      },
    },
    legend: {
      show: true, // Mostrar la leyenda con los textos y colores
    },
    dataLabels: {
      enabled: true, // Mostrar los valores dentro de las barras
      formatter: (val: number): string => {
        return val.toLocaleString('de-DE'); // Formatear los valores con puntos como separadores de miles
      },
      style: {
        fontSize: '12px',
        colors: ['#424242'], // Cambiar el color del texto a gris oscuro
      },
    },

    tooltip: {
      enabled: true, // Habilitar el tooltip
      theme: 'light', // Tema del tooltip (dark o light)
      y: {
        formatter: (val: number) => {
          return `${val.toLocaleString('de-DE')} kWh`; // Formatear el valor con puntos y agregar texto
        }
      }
    }
  };

  this.chartSolLuna = new ApexCharts(
    document.querySelector('#chartSolLunaRef') as HTMLElement,
    options
  );

  this.chartSolLuna.render();
}





  
}



