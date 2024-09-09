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

  @ViewChild('emisionesChart')
  emisionesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartAhorroRecuperoRef') chartAhorroRecuperoRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartEnergiaRef')
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
    this.initializeChartEnergiaConsumo();
    
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
    this.initializeChartEmisionesEvitadasAcumuladas();

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
/****************************************************************************************** */
  // Función para actualizar el gráfico con los nuevos valores
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
/******************************************************************************************************************* */
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
        labels: {
          formatter: (val: number): string => {
            return val.toLocaleString('de-DE'); // Formatea el número con punto como separador de miles
          },
        },
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
        categories: [' '],
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
      document.querySelector('#chartEnergiaRef') as HTMLElement,
      options
    );

    this.chartEnergia.render();
  }

  private initializeChartAhorroRecupero() {
    this.periodoVeinteanalFlujoIngresosMonetariosCopia = JSON.parse(
      JSON.stringify(this.periodoVeinteanalFlujoIngresosMonetarios)
    );
  
    const recuperoInversionMeses = this.sharedService.getPlazoInversionValue();
    const recuperoInversionAnios = Math.round(recuperoInversionMeses / 12);
    const primerAno = this.periodoVeinteanalFlujoIngresosMonetariosCopia[0].year;
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
        },
        {
          name: 'Ingreso por excedente de energía',
          data: ingresoData,
        },
      ],
      chart: {
        height: 300,
        width: 470,
        type: 'line',
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      xaxis: {
        categories: categories,
        title: {
          text: 'Años',
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif',
          },
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
      },
      annotations: {
        xaxis: [
          {
            x: anoRecuperoInversion.toString(), // Momento de recupero como string, si usas categorías como string
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
  
    // Log para verificar el valor de la anotación
    console.log("Anotación del año de recupero:", anoRecuperoInversion.toString());
  
    // Renderiza el gráfico
    this.chartAhorroRecupero = new ApexCharts(
      document.querySelector('#chartAhorroRecuperoRef') as HTMLElement,
      options
    );
    this.chartAhorroRecupero.render();
  }
  


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
        // Recalcula el ahorro en electricidad total y el ingreso por inyección eléctrica
        // utilizando el nuevo valor de yearlyEnergy. Aquí es donde puedes aplicar la fórmula
        // específica para tu lógica.

        // Ejemplo básico de ajuste proporcional basado en yearlyEnergy
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

     
}
