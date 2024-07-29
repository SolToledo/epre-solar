import { Component, Input, OnInit } from '@angular/core';
import { Chart, ChartDataset, ChartOptions, ChartType } from 'chart.js';

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
      this.periodoVeinteanalGeneracionFotovoltaica.map(item => item.generacionFotovoltaicaKWh),
      'rgba(153, 102, 255, 0.2)',
      'rgba(153, 102, 255, 1)'
    ); 
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
      console.error('Canvas element not found');
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
      console.error('Canvas element not found');
    }
  }
}
