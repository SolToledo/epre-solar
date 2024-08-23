import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Chart, ChartDataset, ChartOptions, ChartType } from 'chart.js';
import 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-graficos',
  templateUrl: './graficos.component.html',
  styleUrls: ['./graficos.component.css'],
})
export class GraficosComponent implements OnInit, AfterViewInit {
  @Input() periodoVeinteanalEmisionesGEIEvitadas!: any[];
  @Input() periodoVeinteanalFlujoEnergia!: any[];
  @Input() periodoVeinteanalFlujoIngresosMonetarios!: any[];
  @Input() periodoVeinteanalGeneracionFotovoltaica!: any[];
  @Input() consumoTotalAnual!: number;

  @ViewChild('emisionesChart') emisionesChartRef!: ElementRef<HTMLCanvasElement>;
  // @ViewChild('energiaChart') energiaChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ingresosChart') ingresosChartRef!: ElementRef<HTMLCanvasElement>;
  // @ViewChild('fotovoltaicaChart') fotovoltaicaChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('solarEnergyPieChart') solarEnergyPieChartRef!: ElementRef<HTMLCanvasElement>;

  public barChartOptions: ChartOptions = {
    responsive: true,
  };
  public barChartLabels: string[] = [];

  ngOnInit(): void {
    this.initializeChartLabels();
   
  }

  ngAfterViewInit(): void {
    this.loadCharts();
  }

  initializeChartLabels(): void {
    this.barChartLabels = this.periodoVeinteanalEmisionesGEIEvitadas.map(
      (_, index) => `Año ${index + 1}`
    );
  }

  loadCharts(): void {
    this.createChart(
      this.emisionesChartRef.nativeElement,
      'line',
      [{
        label: 'Emisiones GEI Evitadas',
        data: this.periodoVeinteanalEmisionesGEIEvitadas.map(item => item.emisionesTonCO2),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
      }]
    );
  
    this.createChart(
      this.ingresosChartRef.nativeElement,
      'line',
      [
        {
          label: 'Ahorro Eléctrico Usd',
          data: this.periodoVeinteanalFlujoIngresosMonetarios.map(item => item.ahorroEnElectricidadTotalUsd),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
        },
        {
          label: 'Ingreso usd por Inyección',
          data: this.periodoVeinteanalFlujoIngresosMonetarios.map(item => item.ingresoPorInyeccionElectricaUsd),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
        }
      ]
    );
  
    this.createPieChart();
  }
  
  createChart(
    canvas: HTMLCanvasElement,
    type: ChartType,
    datasets: ChartDataset[]
  ): void {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: type,
        data: {
          labels: this.barChartLabels,
          datasets: datasets.map(dataset => ({
            ...dataset,
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
  }
  

  createPieChart(): void {
    if (!this.solarEnergyPieChartRef || !this.solarEnergyPieChartRef.nativeElement) {
      console.error('Canvas reference is not available');
      return;
    }
  
    const totalGenerado = this.periodoVeinteanalGeneracionFotovoltaica.reduce(
      (acc, item) => acc + item.generacionFotovoltaicaKWh,
      0
    );
  
    const consumoRestante = totalGenerado - this.consumoTotalAnual;
  
    const data = {
      labels: ['Energía Solar Generada', 'Consumo Total'],
      datasets: [
        {
          data: [totalGenerado, consumoRestante],
          backgroundColor: [
            'rgba(255, 205, 86, 0.7)',
            'rgba(201, 203, 207, 0.7)',
          ],
          hoverBackgroundColor: [
            'rgba(255, 205, 86, 1)',
            'rgba(201, 203, 207, 1)',
          ],
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 1,
        },
      ],
    };
  
    const ctx = this.solarEnergyPieChartRef.nativeElement.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
          responsive: true,
          animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1500,
          },
          interaction: {
            mode: 'index',
            intersect: true,
          },
          maintainAspectRatio: true,
          aspectRatio: 2,
          cutout: '10%',
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                font: {
                  size: 14,
                },
                color: '#333',
              },
            },
          },
        },
      });
    } else {
      console.error('Failed to get 2D context');
    }
  }
}
