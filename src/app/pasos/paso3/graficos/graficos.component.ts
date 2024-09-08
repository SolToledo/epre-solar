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
import {
  Chart,
  ChartOptions,
  ChartData,
  ChartType,
  ChartDataset,
} from 'chart.js';
import 'chartjs-plugin-datalabels';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Subscription } from 'rxjs';
import { EmisionesGeiEvitadasFront } from 'src/app/interfaces/emisiones-gei-evitadas-front';
import { FlujoEnergiaFront } from 'src/app/interfaces/flujo-energia-front';
import { FlujoIngresosMonetariosFront } from 'src/app/interfaces/flujo-ingresos-monetarios-front';
import { GeneracionFotovoltaicaFront } from 'src/app/interfaces/generacion-fotovoltaica-front';
import { SharedService } from 'src/app/services/shared.service';
import * as ApexCharts from 'apexcharts';
Chart.register(annotationPlugin);


@Component({
  selector: 'app-graficos',
  templateUrl: './graficos.component.html',
  styleUrls: ['./graficos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraficosComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() periodoVeinteanalEmisionesGEIEvitadas!: EmisionesGeiEvitadasFront[];
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

  private emisionesChart!: Chart;
  private ahorrosChart!: Chart;
  private energiaChart!: Chart;
  private subscription!: Subscription;
  recuperoInversionMeses!: number;
  carbonOffSet!: number;
  yearlyEnergy!: number;
  @Input() yearlyEnergyInitial!: number;
  porcentajeCubierto: number = 0;
  carbonOffSetInicialTon!: number;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = new Subscription();

    this.carbonOffSetInicialTon = this.sharedService.getCarbonOffSet();
    this.periodoVeinteanalEmisionesGEIEvitadas =
      this.periodoVeinteanalEmisionesGEIEvitadas.map((item) => ({
        ...item,
        emisionesTonCO2Original: item.emisionesTonCO2,
      }));

    this.yearlyEnergy = this.sharedService.getYearlyEnergyAcKwh();
    this.recuperoInversionMeses = this.sharedService.getPlazoInversionValue();
  }

  ngAfterViewInit(): void {
    this.createEmisionesChart();
    this.chartEnergia();
    this.chartAhorroRecupero();
    this.actualizarEmisionesChart();
    this.createAhorrosChart();
    this.createEnergiaChart();
    this.updateEnergyChart();
    this.createChartWithApexChart();
    this.subscription.add(
      this.sharedService.carbonOffSet$.subscribe((nuevoValor) => {
        this.calcularEmisionesAjustadas(nuevoValor);
        this.actualizarEmisionesChart();
      })
    );

    this.subscription.add(
      this.sharedService.yearlyEnergyAcKwh$.subscribe((yearlyEnergy) => {
        this.yearlyEnergy = yearlyEnergy;
        setTimeout(() => {
          this.updateAhorrosChart();
          this.updateEnergyChart();
        }, 100);
      })
    );
    this.subscription.add(
      this.sharedService.plazoInversion$.subscribe((meses) => {
        this.recuperoInversionMeses = Math.round(meses);
      })
    );
    this.cdr.detectChanges();
  }

  
//GRAFICOS
  createChartWithApexChart() {
    var options = {
      series: [{
        name:  'Emisiones CO₂',
        data: [31, 40, 28, 51, 42, 109, 100]
      }],
      chart: {
        height: 350,
        width: 470, // Establece el ancho a 470
        type: 'area',
        toolbar: {
          show: false // Oculta la barra de herramientas
        },
        zoom: {
          enabled: false // Desactiva el zoom
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        colors: ['#96c0b2'], // Color de la línea
        width: 4 // Hacer la línea un poco más gruesa
      },
      fill: {
        colors: ['#96c0b2'], // Color de la sombra
        opacity: 0.05 // Ajusta la opacidad de la sombra a un valor menor
      },
      markers: {
        size: 0, // Oculta todos los puntos
        hover: {
          size: 6, // Tamaño del punto cuando se muestra el tooltip
          colors: ['#00754a'], // Color del punto cuando se muestra el tooltip
          strokeColor: '#00754a', // Color del borde del punto cuando se muestra el tooltip
          strokeWidth: 2 // Ancho del borde del punto
        }
      },
      xaxis: {
        categories: ['2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034'],
        title: {
          text: 'Año', // Título del eje X
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Ton CO₂', // Título del eje Y con el 2 en subíndice
          style: {
            fontSize: '12px',
            fontFamily: 'sodo sans, sans-serif'
          }
        }
      },
      tooltip: {
        enabled: true, // Habilita el tooltip
        theme: 'light', // Tema del tooltip (dark o light)
        x: {
          format: 'dd/MM/yy HH:mm'
        },
        marker: {
          show: true // Muestra el marcador en el tooltip
        },
        style: {
          fontSize: '12px', // Tamaño de fuente del texto del tooltip
          fontFamily: 'sodo sans, sans-serif' // Tipografía del texto del tooltip
        }
      }

      
    };
  
    var chart = new ApexCharts(document.querySelector("#chart"), options);
    
    chart.render();
  }
  
  
  chartEnergia() {
    var options = {
      chart: {
        height: 300,
        width: 470,
        type: 'bar',
        toolbar: {
          show: false // Oculta la barra de herramientas
        },
        zoom: {
          enabled: false // Desactiva el zoom
        }
      },

      series: [{
        name: "distibuted",
        data: [21, 22]
      }],

      colors: [
        "#96c0b2",
        "#e4c58d",
      ],

      plotOptions: {
        bar: {
          columnWidth: "45%",
          distributed: true
        }
      },

      dataLabels: {
        enabled: false
      },

      legend: {
        show: true
      },

      grid: {
        show: true
      },

      yaxis: {
        title: {
          text: "kWh",
          style: {
            fontSize: "12px",  // Tamaño de fuente para que sea consistente
            fontFamily: "sodo sans, sans-serif",  // Ajusta la tipografía
          }
        }
      },

      xaxis: {
        categories: [
          ["Consumo", "anual"],
          ["Generación", "fotovoltaica", "anual"]
        ],
        
        labels: {
          style: {
            colors: [
              "#424242",
              "#424242",
            ],
            fontSize: "12px",
          },
        }
      }
    }
    
    var chart = new ApexCharts(document.querySelector("#chartEnergia"), options);
    
    chart.render();
  }


  chartAhorroRecupero() {
    var options = {
      series: [
        {
          name: "Ahorro por autoconsumo de energía",
          data: [45, 52, 38, 24, 33, 26]
        },
        {
          name: "Ingreso por excedentede energía",
          data: [35, 41, 62, 42, 13, 18]
        }
      ],
  
      chart: {
        height: 300,
        width: 470,
        type: "line",
        toolbar: {
          show: false // Oculta la barra de herramientas
        },
        zoom: {
          enabled: false // Desactiva el zoom
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 5,
        curve: "straight",
        dashArray: [0, 0]  // Ajusta el dashArray según las líneas que mantengas
      },
      colors: [
        "#96c0b2",  // Color para la primera línea
        "#e4c58d"   // Color para la segunda línea
      ],
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      xaxis: {
        labels: {
          trim: false
        },
        categories: [
          "01 Jan",
          "02 Jan",
          "03 Jan",
          "04 Jan",
          "05 Jan",
          "06 Jan"
        ],
        type: "datetime",
        title: {
          text: "Años", // Título del eje X
          style: {
            fontSize: "12px",
            fontFamily: "sodo sans, sans-serif",
          }
        }
      },
      yaxis: {
        title: {
          text: "USD", // Título del eje Y
          style: {
            fontSize: "12px",
            fontFamily: "sodo sans, sans-serif",
          }
        }
      },
      grid: {
        borderColor: "#f1f1f1"
      },
      tooltip: {
        enabled: false  // Desactiva el tooltip
      },
      annotations: {
        xaxis: [
          {
            x: new Date("04 Jan").getTime(),  // Ajusta la fecha según lo necesario
            strokeDashArray: 0,
            borderColor: "#00754a",
            label: {
              borderColor: "#00754a",
              style: {
                color: "#fff",
                background: "#00754a"
              },
              text: "Momento de recupero"
            }
          }
        ],
 
      }
    };
  
    var chart = new ApexCharts(document.querySelector("#chartAhorroRecupero"), options);
  
    chart.render();
  }
  
//GRAFICOS


  ngOnDestroy(): void {
    if (this.emisionesChart) {
      this.emisionesChart.destroy();
    }

    if (this.ahorrosChart) {
      this.ahorrosChart.destroy();
    }

    if (this.energiaChart) {
      this.energiaChart.destroy();
    }

    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private createEmisionesChart(): void {
    const ctx = this.emisionesChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.emisionesChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.periodoVeinteanalEmisionesGEIEvitadas.map(
            (item) => item.year
          ),
          datasets: [
            {
              label: 'Emisiones GEI evitadas acumuladas',
              data: this.calcularEmisionesAcumuladas(),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              fill: false,
              tension: 0.4,
              pointRadius: 2, // 0 sin puntos en la línea
              type: 'line',
              pointRotation: 90,
              pointBackgroundColor: 'green',
              pointHoverRadius: 3,
              normalized: true,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: false,
                text: 'Año',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Ton CO2',
              },
              beginAtZero: true,
            },
          },
          plugins: {
            legend: {
              display: false,
              position: 'top',
            },
            datalabels: {
              display: true,
            },
          },
        },
      });
    } else {
      console.error('El contexto 2D no está disponible.');
    }
  }

  private calcularEmisionesAjustadas(nuevoValor: number): void {
    const factor =
      nuevoValor /
      this.periodoVeinteanalEmisionesGEIEvitadas[0].emisionesTonCO2Original!;
    this.periodoVeinteanalEmisionesGEIEvitadas =
      this.periodoVeinteanalEmisionesGEIEvitadas.map((item) => ({
        ...item,
        emisionesTonCO2: item.emisionesTonCO2Original! * factor,
      }));
  }

  private calcularEmisionesAcumuladas(): number[] {
    return this.periodoVeinteanalEmisionesGEIEvitadas.reduce<number[]>(
      (acc, item, index) => {
        const acumulado =
          index === 0
            ? item.emisionesTonCO2
            : acc[index - 1] + item.emisionesTonCO2;
        acc.push(acumulado);
        return acc;
      },
      []
    );
  }

  private actualizarEmisionesChart(): void {
    if (this.emisionesChart) {
      this.emisionesChart.data.datasets[0].data =
        this.calcularEmisionesAcumuladas();
      this.emisionesChart.update();
    }
  }

  private createAhorrosChart(): void {
    const ctx = this.ahorrosChartRef.nativeElement.getContext('2d');

    if (ctx) {
      // Datos de entrada
      const labels = this.periodoVeinteanalFlujoIngresosMonetarios.map(
        (item) => `${item.year}`
      );
      const ahorroData = this.periodoVeinteanalFlujoIngresosMonetarios.map(
        (item) => item.ahorroEnElectricidadTotalUsd
      );
      const ingresoData = this.periodoVeinteanalFlujoIngresosMonetarios.map(
        (item) => item.ingresoPorInyeccionElectricaUsd
      );

      // Convertir los meses de recuperación a años
      const recuperoInversionYear = Math.round(
        this.recuperoInversionMeses / 12
      );
      const startYear = parseInt(labels[0], 10);
      const recuperoInversionActualYear = startYear + recuperoInversionYear;

      // Crear configuración del gráfico
      const data: ChartData<'line'> = {
        labels: labels,
        datasets: [
          {
            label: 'Ahorro por autoconsumo de energía',
            data: ahorroData,
            borderColor: 'rgba(30, 144, 255, 1)', // Azul para la línea
            backgroundColor: 'rgba(30, 144, 255, 0.1)', // Fondo azul
            fill: false,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            type: 'line',
            pointStyle: 'rectRounded',
          },
          {
            label: 'Ingreso por excedentes de energía',
            data: ingresoData,
            borderColor: 'rgba(255, 165, 0, 1)', // Naranja para la línea
            backgroundColor: 'rgba(255, 165, 0, 0.1)', // Fondo naranja
            fill: false,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            type: 'line',
            pointStyle: 'rectRounded',
          },
        ],
      };

      const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            align: 'start',
            labels: {
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                if (context.dataset.label === 'Año de Recupero de Inversión') {
                  return `Año: ${context.parsed.x}`;
                }
                return `${context.dataset.label}: ${context.parsed.y.toFixed(
                  0
                )}`;
              },
            },
            enabled: true,
            mode: 'nearest',
            intersect: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Año',
            },
            ticks: {
              autoSkip: true,
              maxRotation: 45,
              minRotation: 0,
            },
          },
          y: {
            title: {
              display: true,
              text: 'USD',
            },
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.2)',
            },
          },
        },
      };

      // Crear el gráfico
      this.ahorrosChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options,
      });
    } else {
      console.error('El contexto 2D no está disponible.');
    }
  }

  private updateAhorrosChart(): void {
    this.recalcularFlujoIngresos();

    if (
      this.ahorrosChart &&
      this.ahorrosChart.data &&
      Array.isArray(this.ahorrosChart.data.labels)
    ) {
      this.ahorrosChart.data.datasets[0].data =
        this.periodoVeinteanalFlujoIngresosMonetarios.map(
          (item) => item.ahorroEnElectricidadTotalUsd
        );
      this.ahorrosChart.data.datasets[1].data =
        this.periodoVeinteanalFlujoIngresosMonetarios.map(
          (item) => item.ingresoPorInyeccionElectricaUsd
        );
      // Recalcular el año de recuperación de inversión
      const recuperoInversionYear = Math.round(
        this.recuperoInversionMeses / 12
      );
      const startYear = parseInt(this.ahorrosChart.data.labels[0] as string);
      const recuperoInversionActualYear = startYear + recuperoInversionYear;
      const recuperoInversionIndex = this.ahorrosChart.data.labels.indexOf(
        recuperoInversionActualYear.toString()
      );

      /* this.ahorrosChart.data.datasets[2].data =
        recuperoInversionIndex !== -1
          ? [
              {
                x: recuperoInversionActualYear,
                y:
                  Math.max(
                    ...this.periodoVeinteanalFlujoIngresosMonetarios.map(
                      (item) => item.ahorroEnElectricidadTotalUsd
                    ),
                    ...this.periodoVeinteanalFlujoIngresosMonetarios.map(
                      (item) => item.ingresoPorInyeccionElectricaUsd
                    )
                  ) * 0.5,
                r: 6,
              },
            ]
          : []; */
      this.ahorrosChart.update();
      this.ahorrosChart.render();
    } else {
      console.error('El gráfico de ahorros no se ha inicializado.');
    }
  }

  private recalcularFlujoIngresos(): void {
    this.periodoVeinteanalFlujoIngresosMonetarios.forEach((item) => {
      item.ahorroEnElectricidadTotalUsd = this.calcularAhorro(
        item.ahorroEnElectricidadTotalUsd
      );
      item.ingresoPorInyeccionElectricaUsd = this.calcularIngreso(
        item.ingresoPorInyeccionElectricaUsd
      );
    });
    this.yearlyEnergyInitial = this.yearlyEnergy;
  }

  private calcularAhorro(ahorroActual: number): number {
    if (this.yearlyEnergyInitial === 0) {
      console.warn('yearlyEnergyInitial es cero');
      return ahorroActual;
    }

    return (this.yearlyEnergy / this.yearlyEnergyInitial) * ahorroActual;
  }

  private calcularIngreso(ingresoActual: number): number {
    if (this.yearlyEnergyInitial === 0) {
      console.warn('yearlyEnergyInitial es cero');
      return ingresoActual;
    }
    return (this.yearlyEnergy / this.yearlyEnergyInitial) * ingresoActual;
  }

  private createEnergiaChart(): void {
    const ctx = this.energiaChartRef.nativeElement.getContext('2d');
    if (ctx) {
      const totalGenerado = this.periodoVeinteanalGeneracionFotovoltaica.reduce(
        (sum, item) => sum + item.generacionFotovoltaicaKWh,
        0
      );

      const energiaFotovoltaicaPromedio =
        totalGenerado / this.periodoVeinteanalGeneracionFotovoltaica.length;

      this.porcentajeCubierto =
        ((this.yearlyEnergy || energiaFotovoltaicaPromedio) /
          this.consumoTotalAnual) *
        100;

      const data = {
        labels: ['Consumo anual', 'Generación fotovoltaica anual'],
        datasets: [
          {
            label: 'Energía (kWh)',
            data: [this.consumoTotalAnual, energiaFotovoltaicaPromedio],
            backgroundColor: [
              'rgba(212, 233, 226, 0.9)',
              'rgba(203, 162, 88, 0.4)',
            ],
            borderColor: ['rgb(212, 233, 226)', 'rgba(203, 162, 88, 1)'],
            borderWidth: 1,
          },
        ],
      };

      const options: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'kWh',
            },
          },
          x: {
            title: {
              display: false,
              text: 'Categoría',
            },
          },
        },
        plugins: {
          legend: {
            display: false,
            position: 'top',
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleColor: '#fff',
            bodyColor: '#fff',
            displayColors: true,
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${context.formattedValue} kWh`;
              },
            },
          },
        },
      };

      const config: any = {
        type: 'bar',
        data: data,
        options: options,
      };
      this.porcentajeCubierto =
        ((this.yearlyEnergy || energiaFotovoltaicaPromedio) /
          this.consumoTotalAnual) *
        100;

      this.energiaChart = new Chart(ctx, config);
    } else {
      console.error('El contexto 2D no está disponible.');
    }
  }

  private updateEnergyChart(): void {
    if (this.energiaChart) {
      const totalGenerado = this.periodoVeinteanalGeneracionFotovoltaica.reduce(
        (sum, item) => sum + item.generacionFotovoltaicaKWh,
        0
      );

      const energiaFotovoltaicaPromedio =
        totalGenerado / this.periodoVeinteanalGeneracionFotovoltaica.length;

      this.porcentajeCubierto =
        ((this.yearlyEnergy || energiaFotovoltaicaPromedio) /
          this.consumoTotalAnual) *
        100;

      // Actualiza los datos en el gráfico
      this.energiaChart.data.datasets[0].data = [
        this.consumoTotalAnual,
        this.yearlyEnergy || energiaFotovoltaicaPromedio,
      ];

      this.energiaChart.update();
      this.energiaChart.render();
      this.cdr.detectChanges(); 
    }
  }
}
