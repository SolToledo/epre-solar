import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { driver }  from 'driver.js';
@Component({
  selector: 'app-paso0',
  templateUrl: './paso0.component.html',
  styleUrls: ['./paso0.component.css']
})
export class Paso0Component implements OnInit {
  showModal: boolean = false;
  isTermsAccepted: boolean = false;

  constructor(private router: Router, private snackBar: MatSnackBar) {}
 
  ngOnInit(): void {
    
    const driverObj = driver({
      showProgress: true,
      steps: [
        { element: '#titulo', popover: { title: 'Información importante', description: 'Esta aplicación permite calcular los ahorros económicos y en emisiones, de la instalación de generación distribuida solar en hogares, comercios o industrias', side: "left", align: 'start' }},
        { element: '#ubicacion', popover: { title: 'Ubicación', description: 'Debe indicarse el lugar donde se planea instalar los paneles fotovoltaicos. Puede buscar la dirección del lugar, o seleccionar en el mapa.', side: "left", align: 'start' }},
        { element: '#consumo', popover: { title: 'Consumo de electricidad y categoría tarifaria', description: 'Deben seleccionarse la categoría del suministro eléctrico donde se quiere instalar equipamiento de Generación Distribuida, y consumos de electricidad registrados en los 12 últimos meses.', side: "left", align: 'start' }},
        { element: '#consumoAdvertencia', popover: { title: 'Consumo de electricidad y categoría tarifaria', description: 'En caso de no contar la misma, se considerarán los valores promedios de consumo para la categoría tarifaria del suministro.', side: "left", align: 'start' }},
        { element: '#ver-terminos', popover: { title: 'Para continuar debe aceptar los términos y condiciones', description: 'La aplicación proporciona una estimación económica de la inversión necesaria por la instalación de paneles fotovoltaicos y los ahorros obtenidos, incluyendo el plazo previsto de recupero de la inversión.', side: "left", align: 'start' }},
       
      ]
    });
    driverObj.drive();
  }
  

  goBack() {
    this.router.navigate(['/']);
  }

  goToPaso1() {
    if (this.isTermsAccepted) {
      this.router.navigate(['pasos/1']);
    } else {
      this.snackBar.open('Debe aceptar los términos y condiciones para continuar.', '', {
        duration: 3000,
        panelClass: ['custom-snackbar']
      });
    }
  }

  showTerms() {
    this.showModal = true;
  }

  handleAccepted(event: boolean) {
    this.showModal = false;
    this.isTermsAccepted = event;
  }

  showTooltip(event: MouseEvent) {
    if (!this.isTermsAccepted) {
      this.snackBar.open('Debe aceptar los términos y condiciones para continuar.', '', {
        duration: 3000,
        panelClass: ['custom-snackbar']
      });
    }
  }

  hideTooltip(event: MouseEvent) {
    this.snackBar.dismiss();
  }
}
