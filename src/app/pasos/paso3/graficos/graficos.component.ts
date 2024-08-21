import { Component, Input, OnInit } from '@angular/core';
import { Chart, ChartDataset, ChartOptions, ChartType } from 'chart.js';
import 'chartjs-plugin-datalabels';
@Component({
  selector: 'app-graficos',
  templateUrl: './graficos.component.html',
  styleUrls: ['./graficos.component.css'],
})
export class GraficosComponent implements OnInit {
  @Input() periodoVeinteanalEmisionesGEIEvitadas!: any[];
  @Input() periodoVeinteanalFlujoEnergia!: any[];
  @Input() periodoVeinteanalFlujoIngresosMonetarios!: any[];
  @Input() periodoVeinteanalGeneracionFotovoltaica!: any[];
  @Input() consumoTotalAnual!: number;

  public barChartOptions: ChartOptions = {
    responsive: true,
  };
  public barChartLabels: string[] = [];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];

  public barChartData: ChartDataset[] = [];

  ngOnInit(): void {
    this.initializeChartLabels();
    this.loadCharts();
  }

  initializeChartLabels(): void {
    this.barChartLabels = this.periodoVeinteanalEmisionesGEIEvitadas.map(
      (_, index) => `Año ${index + 1}`
    );
  }

  loadCharts(): void {
    this.createChart(
      'emisionesChart',
      'line',
      'Emisiones GEI Evitadas',
      this.periodoVeinteanalEmisionesGEIEvitadas.map(
        (item) => item.emisionesTonCO2
      ),
      'rgba(75, 192, 192, 0.2)',
      'rgba(75, 192, 192, 1)'
    );

    this.createChartDouble('energiaChart', 'line', [
      {
        label: 'Autoconsumida',
        data: this.periodoVeinteanalFlujoEnergia.map(
          (item) => item.autoconsumida
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
      },
      {
        label: 'Inyectada',
        data: this.periodoVeinteanalFlujoEnergia.map((item) => item.inyectada),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
      },
    ]);

    this.createChartDouble('ingresosChart', 'line', [
      {
        label: 'Ahorro Eléctrico Usd',
        data: this.periodoVeinteanalFlujoIngresosMonetarios.map(
          (item) => item.ahorroEnElectricidadTotalUsd
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
      },
      {
        label: 'Ingreso usd por Inyección',
        data: this.periodoVeinteanalFlujoIngresosMonetarios.map(
          (item) => item.ingresoPorInyeccionElectricaUsd
        ),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
      },
    ]);

    this.createChart(
      'fotovoltaicaChart',
      'line',
      'Generación Fotovoltaica',
      this.periodoVeinteanalGeneracionFotovoltaica.map(
        (item) => item.generacionFotovoltaicaKWh
      ),
      'rgba(153, 102, 255, 0.2)',
      'rgba(153, 102, 255, 1)'
    );

    this.createPieChart();
  }

  createChart(
    elementId: string,
    type: ChartType,
    label: string,
    data: number[],
    backgroundColor: string,
    borderColor: string
  ): void {
    const canvas = document.getElementById(elementId) as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: type,
          data: {
            labels: this.barChartLabels,
            datasets: [
              {
                label: label,
                data: data,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
                pointBackgroundColor: borderColor,
                pointBorderColor: 'white',
                pointHoverBackgroundColor: 'white',
                pointHoverBorderColor: borderColor,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Años',
                },
              },
              y: {
                display: true,
                title: {
                  display: true,
                  text: 'Valor',
                },
              },
            },
          },
        });
      } else {
        console.error('Failed to get 2D context');
      }
    } else {
      /* console.error('Canvas element not found'); */
    }
  }

  createChartDouble(
    elementId: string,
    type: ChartType,
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
    }>
  ): void {
    const canvas = document.getElementById(elementId) as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: type,
          data: {
            labels: this.barChartLabels,
            datasets: datasets.map((dataset) => ({
              ...dataset,
              borderColor: dataset.borderColor,
              backgroundColor: dataset.backgroundColor,
              pointBackgroundColor: dataset.borderColor,
              pointBorderColor: 'white',
              pointHoverBackgroundColor: 'white',
              pointHoverBorderColor: dataset.borderColor,
              fill: true,
            })),
          },
          options: {
            responsive: true,
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Años',
                },
              },
              y: {
                display: true,
                title: {
                  display: true,
                  text: 'Valor',
                },
              },
            },
          },
        });
      } else {
        console.error('Failed to get 2D context');
      }
    } else {
      /* console.error('Canvas element not found'); */
    }
  }
  
  createPieChart(): void {
    const totalGenerado = this.periodoVeinteanalGeneracionFotovoltaica.reduce(
      (acc, item) => acc + item.generacionFotovoltaicaKWh,
      0
    );
  
    let consumoRestante = totalGenerado - this.consumoTotalAnual ;
  
    const data = {
      labels: ['Energía Solar Generada', 'Consumo Total'],
      datasets: [
        {
          data: [totalGenerado, consumoRestante],
          backgroundColor: ['rgba(255, 205, 86, 0.7)', 'rgba(201, 203, 207, 0.7)'],
          hoverBackgroundColor: ['rgba(255, 205, 86, 1)', 'rgba(201, 203, 207, 1)'],
          borderColor: ['#ffffff', '#ffffff'], // Borde blanco
          borderWidth: 1,
        },
      ],
    };
  
    const canvas = document.getElementById('solarEnergyPieChart') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: 'pie',
          data: data,
          options: {
            responsive: true,
            animation: {
              animateScale: true, // Escala la torta
              animateRotate: true, // Gira la torta al aparecer
              duration: 1500, // Duración de la animación en milisegundos
            },
            interaction: {
              mode: 'index', // 'point', 'nearest', 'index'
              intersect: true, // Si es true, solo reacciona cuando el puntero está directamente sobre una sección
            },
            maintainAspectRatio: true,
            aspectRatio: 2,
            cutout: '10%',
            plugins: {
              legend: {
                display: true,
                position: 'bottom', // Cambia la posición de la leyenda ('top', 'left', 'bottom', 'right')
                labels: {
                  font: {
                    size: 14, // Tamaño de la fuente
                  },
                  color: '#333', // Color de la fuente
                },
              },
            },
          },
        });
      } else {
        console.error('Failed to get 2D context');
      }
    } else {
      console.error('Canvas element not found');
    }
  
  }
}
