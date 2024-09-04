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
import { Chart, ChartData, ChartOptions } from 'chart.js';
import 'chartjs-plugin-datalabels';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Subscription } from 'rxjs';
import { EmisionesGeiEvitadasFront } from 'src/app/interfaces/emisiones-gei-evitadas-front';
import { FlujoEnergiaFront } from 'src/app/interfaces/flujo-energia-front';
import { FlujoIngresosMonetariosFront } from 'src/app/interfaces/flujo-ingresos-monetarios-front';
import { GeneracionFotovoltaicaFront } from 'src/app/interfaces/generacion-fotovoltaica-front';
import { SharedService } from 'src/app/services/shared.service';
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

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    
  }

  ngOnInit(): void {
    this.subscription = new Subscription();

    this.subscription.add(
      this.sharedService.carbonOffSet$.subscribe((nuevoValor) => {
        this.carbonOffSet = nuevoValor;
        // this.recalcularEmisiones(nuevoValor);
        // this.updateEmisionesChart();
      })
    );
    this.yearlyEnergy = this.sharedService.getYearlyEnergyAcKwh();
    this.recuperoInversionMeses = this.sharedService.getPlazoInversionValue();
  }

  ngAfterViewInit(): void {
    // this.createEnergiaChart();
    // this.updateEnergyChart();
    this.createAhorrosChart();
    // this.createEmisionesChart();
    this.subscription.add(
      this.sharedService.yearlyEnergyAcKwh$.subscribe((yearlyEnergy) => {
        this.yearlyEnergy = yearlyEnergy;
        setTimeout(() => {
          this.updateAhorrosChart();
          // this.updateEnergyChart();
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
              data: this.periodoVeinteanalEmisionesGEIEvitadas.map(
                (item) => item.emisionesTonCO2
              ),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
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
              display: true, // Desactiva las etiquetas de datos
            },
          },
        },
      });
    } else {
      console.error('El contexto 2D no está disponible.');
    }
  }

  private recalcularEmisiones(nuevoValor: number): void {
    if (
      this.periodoVeinteanalEmisionesGEIEvitadas &&
      this.periodoVeinteanalEmisionesGEIEvitadas.length > 0
    ) {
      const valorInicial =
        this.periodoVeinteanalEmisionesGEIEvitadas[0].emisionesTonCO2;
      const factor = nuevoValor / valorInicial;

      this.periodoVeinteanalEmisionesGEIEvitadas =
        this.periodoVeinteanalEmisionesGEIEvitadas.map((item, index) => {
          const emisionesAjustadas = item.emisionesTonCO2 * factor;
          const acumulado =
            index === 0
              ? emisionesAjustadas
              : emisionesAjustadas +
                this.periodoVeinteanalEmisionesGEIEvitadas[index - 1]
                  .emisionesTonCO2;
          return {
            ...item,
            emisionesTonCO2: acumulado,
          };
        });
    }
  }

  private updateEmisionesChart(): void {
    if (this.emisionesChart) {
      this.emisionesChart.data.datasets[0].data =
        this.periodoVeinteanalEmisionesGEIEvitadas.map(
          (item) => item.emisionesTonCO2
        );
      this.emisionesChart.update();
    }
  }

  private createAhorrosChart(): void {
    const ctx = this.ahorrosChartRef.nativeElement.getContext('2d');
    console.log('ctx :', ctx);

    if (ctx) {
      // Datos de entrada
      console.log(
        'ahorrosChartRef.nativeElement :',
        this.ahorrosChartRef.nativeElement
      );
      console.log(
        'periodoVeinteanalFlujoIngresosMonetarios :',
        this.periodoVeinteanalFlujoIngresosMonetarios
      );
      console.log('yearlyEnergy :', this.yearlyEnergy);
      console.log('yearlyEnergyInitial :', this.yearlyEnergyInitial);

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
      console.log('labels :', labels);
      console.log('ahorroData :', ahorroData);
      console.log('ingresoData :', ingresoData);
      console.log('recuperoInversionYear :', recuperoInversionYear);
      console.log('recuperoInversionMeses :', this.recuperoInversionMeses);

      // Obtener el año actual de la primera etiqueta
      const startYear = parseInt(labels[0], 10);
      // Calcular el año de recuperación de inversión
      const recuperoInversionActualYear = startYear + recuperoInversionYear;
      // Verificar si el año calculado está en las etiquetas
      const recuperoInversionIndex = labels.indexOf(
        recuperoInversionActualYear.toString()
      );
      console.log('startYear :', startYear);
      console.log('recuperoInversionActualYear :', recuperoInversionActualYear);
      console.log('recuperoInversionIndex :', recuperoInversionIndex);
      // Crear configuración del gráfico
      const data: ChartData<'line' | 'bubble'> = {
        labels: labels,
        datasets: [
          {
            label: 'Ahorro en Electricidad (USD)',
            data: ahorroData,
            borderColor: 'rgba(54, 162, 235, 1)', // Color de la línea
            backgroundColor: 'rgba(54, 162, 235, 0.1)', // Relleno debajo de la línea
            fill: false,
            borderWidth: 2,
            pointRadius: 0, // Sin puntos en la línea
            tension: 0.4, // Suaviza las curvas
            type: 'line', // Tipo de gráfico de línea
          },
          {
            label: 'Ingreso por Inyección Eléctrica (USD)',
            data: ingresoData,
            borderColor: 'rgba(75, 192, 192, 1)', // Color de la línea
            backgroundColor: 'rgba(75, 192, 192, 0.1)', // Relleno debajo de la línea
            fill: false,
            borderWidth: 2,
            pointRadius: 0, // Sin puntos en la línea
            tension: 0.4, // Suaviza las curvas
            type: 'line', // Tipo de gráfico de línea
          },
          {
            label: 'Punto de Recupero de Inversión',
            data:
              recuperoInversionIndex !== -1
                ? [
                    {
                      x: recuperoInversionActualYear, // Usa el año calculado
                      y: Math.max(...ahorroData, ...ingresoData) * 0.5, // Ajusta el valor Y según sea necesario
                      r: 6, // Radio de la burbuja
                    },
                  ]
                : [],
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            type: 'bubble', // Tipo de gráfico de burbuja
          },
        ],
      };
      console.log('data :', data);

      const options: ChartOptions<'line' | 'bubble'> = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'start',
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Año',
            },
          },
          y: {
            title: {
              display: true,
              text: 'USD',
            },
            beginAtZero: true,
          },
        },
      };
      console.log('options :', options);
      // Crear el gráfico
      this.ahorrosChart = new Chart(ctx, {
        type: 'bubble', // Tipo principal del gráfico
        data: data,
        options: options,
      });
      console.log('this.ahorrosChart :', this.ahorrosChart);
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

      this.ahorrosChart.data.datasets[2].data =
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
          : [];
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
    this.yearlyEnergyInitial = Number(this.yearlyEnergy);
    console.log(typeof  Number(this.yearlyEnergy));
  }

  private calcularAhorro(ahorroActual: number): number {
    if (this.yearlyEnergyInitial === 0) {
      console.warn('yearlyEnergyInitial es cero');
      return ahorroActual;
    }
    console.log("(this.yearlyEnergy / this.yearlyEnergyInitial) * ahorroActual : ", this.yearlyEnergy, this.yearlyEnergyInitial, ahorroActual);
    
    return (Number(this.yearlyEnergy) / Number(this.yearlyEnergyInitial)) * ahorroActual;
  }

  private calcularIngreso(ingresoActual: number): number {
    if (this.yearlyEnergyInitial === 0) {
      console.warn('yearlyEnergyInitial es cero');
      return ingresoActual;
    }
    return (Number(this.yearlyEnergy) / Number(this.yearlyEnergyInitial)) * ingresoActual;
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

      // Llama a la función para actualizar el gráfico
      this.energiaChart.update();
      this.energiaChart.render();
      this.cdr.detectChanges(); // Si estás utilizando ChangeDetectionStrategy.OnPush, esto es necesario.
    }
  }
}
