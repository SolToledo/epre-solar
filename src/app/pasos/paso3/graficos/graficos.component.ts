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
import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
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
  remainingMonths!: number;
  recuperoYear!: number;
  carbonOffSet!: number;
  yearlyEnergy!: number;
  porcentajeCubierto!: number | null;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = new Subscription();

    this.subscription.add(
      this.sharedService.carbonOffSet$.subscribe((nuevoValor) => {
        this.carbonOffSet = nuevoValor;
        this.recalcularEmisiones(nuevoValor);
        this.updateEmisionesChart();
      })
    );

    this.subscription.add(
      this.sharedService.plazoInversion$.subscribe((meses) => {
        this.recuperoInversionMeses = Math.round(meses);
        this.updateAhorrosChart();
      })
    );

    this.subscription.add(
      this.sharedService.yearlyEnergyAcKwh$.subscribe((yearlyEnergy) => {
        this.yearlyEnergy = yearlyEnergy;
        this.updateEnergyChart();
      })
    );
  }

  ngAfterViewInit(): void {
    this.createEmisionesChart();
    this.createAhorrosChart();
    this.createEnergiaChart();
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
    if (ctx) {
      const afterInitPlugin = {
        id: 'afterInitPlugin',
        afterInit: (chart: {
          scales: { [x: string]: any };
          options: {
            plugins: { annotation: { annotations: { yValue: number }[] } };
          };
          update: () => void;
        }) => {
          const yScale = chart.scales['y'];
          if (yScale) {
            const yValue = yScale.min / 2 || 100;
            // Actualizar la anotación con el yValue correcto
            chart.options.plugins.annotation.annotations[0].yValue = yValue;
            chart.update();
          }else{
            chart.options.plugins.annotation.annotations[0].yValue = 200;
          }
        },
      };

      this.ahorrosChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.periodoVeinteanalFlujoIngresosMonetarios.map(
            (item) => item.year
          ),
          datasets: [
            {
              label: 'Ahorro',
              data: this.periodoVeinteanalFlujoIngresosMonetarios.map(
                (item) => item.ahorroEnElectricidadTotalUsd
              ),
              borderColor: 'green', 
              backgroundColor: 'yellow', 
              borderWidth: 2,
              fill: false,
              tension: 0.4,
              borderDash: [], 
            },
            {
              label: 'Inyección Eléctrica',
              data: this.periodoVeinteanalFlujoIngresosMonetarios.map(
                (item) => item.ingresoPorInyeccionElectricaUsd
              ),
              borderColor: 'blue', 
              borderWidth: 2,
              fill: false,
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
              min: 0,
              max: this.periodoVeinteanalFlujoIngresosMonetarios.length,
            },
            y: {
              title: {
                display: true,
                text: 'USD',
              },
              beginAtZero: true,
            },
          },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              align: 'start',
              labels: {
                boxWidth: 16,
              },
            },
            datalabels: {
              display: true,
              backgroundColor: 'green',
            },
            annotation: {
              annotations: this.getAnnotations(),
            },
            
            
          },
         
        },
        // plugins: [afterInitPlugin], // Registramos el plugin personalizado aquí
      });
    } else {
      console.error('El contexto 2D no está disponible.');
    }
  }

  private getAnnotations() {
    const recuperoInversionYear = this.recuperoInversionMeses / 12;
    const yValue = this.ahorrosChart?.scales['y']?.min / 2 || 0;
    return [
      {
        id: 'recupero-inversion',
        type: 'point' as const,
        xScaleID: 'x' as const,
        yScaleID: 'y' as const,
        xValue: recuperoInversionYear,
        yValue: yValue,
        backgroundColor: 'green',
        radius: 5,
        label: {
          content: 'Recupero inversión',
          enabled: true,
          // position: 'bottom' as any,
          position: 'top',
          backgroundColor: '',
          color: 'black',
          font: {
            size: 12,
          },
          padding: 6,
        },
      },
    ];
  }

  private updateAhorrosChart(): void {
    if (this.ahorrosChart) {
      setTimeout(() => {
        this.ahorrosChart.options.plugins!.annotation!.annotations =
          this.getAnnotations();
        this.ahorrosChart.update();
        this.ahorrosChart.render();
      }, 100);
    }
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
      if (this.consumoTotalAnual > 0) {
        this.porcentajeCubierto =
          ((this.yearlyEnergy || energiaFotovoltaicaPromedio) /
            this.consumoTotalAnual) *
          100;
      } else {
        this.porcentajeCubierto = null; // Manejar caso en que el consumo total sea 0
      }

      const data = {
        labels: ['Consumo anual', 'Generación fotovoltaica anual'],
        datasets: [
          {
            data: [this.consumoTotalAnual, energiaFotovoltaicaPromedio],
            backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)'],
            borderColor: '#fff',
            borderWidth: 2,
            hoverBackgroundColor: ['rgb(255, 159, 64)', 'rgb(75, 192, 192)'],
            hoverBorderColor: ['#fff', '#fff'],
            hoverBorderWidth: 3,
            borderJoinStyle: '',
            borderDash: [],
            borderDashOffset: 0,
            hoverOffset: 4,
            offset: [0, 5],
            weight: 1,
            rotation: 0,
            circumference: 360,
            spacing: 1,
          },
        ],
      };

      const options: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: false, // Mantiene el aspecto del gráfico
        aspectRatio: 1,

        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'start',
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Fondo oscuro
            titleColor: '#fff', // Título blanco
            bodyColor: '#fff', // Cuerpo blanco
            displayColors: false,
            position: 'nearest',
            padding: { top: 10, right: 10, bottom: 10, left: 10 },
            titleFont: { size: 14, weight: 'bold' },
            titleAlign: 'left',
            titleSpacing: 2,
            titleMarginBottom: 6,
            bodyFont: { size: 12 },
            bodyAlign: 'left',
            bodySpacing: 2,
            footerFont: { size: 10 },
            footerColor: '#fff',
            footerAlign: 'right',
            footerSpacing: 2,
            footerMarginTop: 6,
            caretPadding: 5,
            caretSize: 5,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: function (context) {
                return context.label + ': ' + context.formattedValue;
              },
            },
          },
          datalabels: {
            color: '#fff',
            anchor: 'end', // Posiciona la etiqueta fuera del arco
            align: 'start', // Alinea la etiqueta a la derecha del arco
          },
        },
        animation: {
          animateRotate: true,
          animateScale: true,
        },
      };

      const config: any = {
        type: 'doughnut',
        data: data,
        options: options,
      };

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
      if (this.consumoTotalAnual > 0) {
        this.porcentajeCubierto =
          ((this.yearlyEnergy || energiaFotovoltaicaPromedio) /
            this.consumoTotalAnual) *
          100;
      } else {
        this.porcentajeCubierto = null; // Manejar caso en que el consumo total sea 0
      }

      // Actualiza los datos en el gráfico
      this.energiaChart.data.datasets[0].data = [
        this.consumoTotalAnual, // Este valor puede permanecer igual si no se ha cambiado
        this.yearlyEnergy || energiaFotovoltaicaPromedio, // Se usa el nuevo valor de yearlyEnergy si está disponible
      ];

      // Llama a la función para actualizar el gráfico
      this.energiaChart.update();
      this.cdr.detectChanges(); // Si estás utilizando ChangeDetectionStrategy.OnPush, esto es necesario.
    }
  }
}
