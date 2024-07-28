import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
})
export class WelcomeComponent implements OnInit {
  
  constructor(private router: Router) {}
  ngOnInit(): void {
    localStorage.clear();
  }

  goToInformacion() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          localStorage.setItem(
            'userPosition',
            JSON.stringify({ latitude, longitude })
          );
        },
        (error) => {
          console.error('Error al obtener la posición geográfica:', error);
        }
      );
    } else {
      console.error('La geolocalización no es soportada por este navegador.');
    }

    this.router.navigate(['pasos/0']);
  }
}
