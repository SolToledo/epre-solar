import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-graficos',
  templateUrl: './graficos.component.html',
  styleUrls: ['./graficos.component.css']
})
export class GraficosComponent implements OnInit {

  ngOnInit(): void {
    this.loadChart();
  }

  loadChart(): void {
    const canvas = document.getElementById('investmentChart') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5'],
            datasets: [{
              label: 'Retorno de inversión',
              data: [50000, 100000, 150000, 200000, 250000],
              borderColor: 'orange',
              backgroundColor: 'rgba(255, 165, 0, 0.2)', // Color de fondo para el área bajo la línea
              pointBackgroundColor: 'orange', // Color de los puntos
              pointBorderColor: 'white', // Color del borde de los puntos
              pointHoverBackgroundColor: 'white', // Color de los puntos al hacer hover
              pointHoverBorderColor: 'orange', // Color del borde de los puntos al hacer hover
              fill: true // Rellenar el área bajo la línea
            }, {
              label: 'Inversión inicial',
              data: [50000, 50000, 50000, 50000, 50000],
              borderColor: '#417B6F',
              backgroundColor: ' rgba(65, 123, 111, 0.2)', // Color de fondo para el área bajo la línea
              pointBackgroundColor:'#417B6F', // Color de los puntos
              pointBorderColor: 'white', // Color del borde de los puntos
              pointHoverBackgroundColor: 'white', // Color de los puntos al hacer hover
              pointHoverBorderColor: '#417B6F', // Color del borde de los puntos al hacer hover
              fill: true // Rellenar el área bajo la línea
            }]
          },
          options: {
            responsive: true,
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Meses'
                }
              },
              y: {
                display: true,
                title: {
                  display: true,
                  text: 'Valor en $'
                }
              }
            }
          }
        });
      } else {
        console.error('Failed to get 2D context');
      }
    } else {
      console.error('Canvas element not found');
    }
  }
}
