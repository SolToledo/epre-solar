import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { Chart } from 'chart.js';
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
  @ViewChild('solarEnergyPieChart')
  solarEnergyPieChartRef!: ElementRef<HTMLCanvasElement>;

  private emisionesChart!: Chart;
  private ahorrosChart!: Chart;
  private subscription!: Subscription;
  private recuperoInversionMeses!: number;
  remainingMonths!: number;
  recuperoYear!: number;
  carbonOffSet!: number;

  constructor(private sharedService: SharedService, private cdr: ChangeDetectorRef) {}

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
        this.recuperoInversionMeses = meses;
        this.updateAhorrosChart();
      })
    );
  }

  ngAfterViewInit(): void {
    this.createEmisionesChart();
    this.createAhorrosChart();
  }

  ngOnDestroy(): void {
    if (this.emisionesChart) {
      this.emisionesChart.destroy();
    }

    if (this.ahorrosChart) {
      this.ahorrosChart.destroy();
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
              label: 'Emisiones GEI Evitadas (toneladas de CO2)',
              data: this.periodoVeinteanalEmisionesGEIEvitadas.map(
                (item) => item.emisionesTonCO2
              ),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              fill: true,
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
                display: false,
                text: 'Emisiones Evitadas (Ton CO2)',
              },
              beginAtZero: false,
            },
          },
          plugins: {
            legend: {
              display: false,
              position: 'top',
            },
            datalabels: {
              display: false, // Desactiva las etiquetas de datos si no las necesitas
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
          return {
            ...item,
            emisionesTonCO2: item.emisionesTonCO2 * factor,
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
      this.ahorrosChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.periodoVeinteanalFlujoIngresosMonetarios.map(
            (item) => item.year
          ),
          datasets: [
            {
              label: 'Ahorro (USD)',
              data: this.periodoVeinteanalFlujoIngresosMonetarios.map(
                (item) => item.ahorroEnElectricidadTotalUsd
              ),
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 2,
              fill: true,
            },
            {
              label: 'Inyección Eléctrica (USD)',
              data: this.periodoVeinteanalFlujoIngresosMonetarios.map(
                (item) => item.ingresoPorInyeccionElectricaUsd
              ),
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              fill: true,
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
              beginAtZero: false,
            },
          },
          plugins: {
            legend: {
              display: false,
              position: 'top',
            },
            datalabels: {
              display: false,
            },
            annotation: {
              annotations: this.getAnnotations(),
            },
          },
        },
      });
    } else {
      console.error('El contexto 2D no está disponible.');
    }
  }

  private getAnnotations() {
    if (!this.recuperoInversionMeses) return [];

    this.recuperoYear = Math.floor(this.recuperoInversionMeses / 12);
    this.remainingMonths = Math.round(this.recuperoInversionMeses % 12);
    this.cdr.detectChanges();
    return [
      {
        id: 'recupero-inversion',
        type: 'point' as const,
        xScaleID: 'x' as const,
        yScaleID: 'y' as const,
        xValue: this.recuperoYear,
        yValue: Math.max(
          ...this.periodoVeinteanalFlujoIngresosMonetarios.map(
            (item) => item.ahorroEnElectricidadTotalUsd
          )
        ),
        backgroundColor: 'red',
        radius: 5,
        label: {
          content: 'Recupero inversión',
          enabled: true,
          position: 'bottom' as any,
          backgroundColor: 'rgba(255,0,0,0.7)',
          color: 'black',
          font: {
            size: 12,
          },
        },
      },
    ];
  }

  private updateAhorrosChart(): void {
    if (this.ahorrosChart) {
      this.ahorrosChart.options.plugins!.annotation!.annotations =
        this.getAnnotations();
      this.ahorrosChart.update();
      this.cdr.detectChanges();
    }
  }
}
