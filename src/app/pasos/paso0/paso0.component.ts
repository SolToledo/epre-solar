import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { driver } from 'driver.js';
import { InstruccionesComponent } from 'src/app/instrucciones/instrucciones.component';
import { MatDialog } from '@angular/material/dialog';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-paso0',
  templateUrl: './paso0.component.html',
  styleUrls: ['./paso0.component.css'],
})
export class Paso0Component implements OnInit, AfterViewInit {
  showModal: boolean = false;
  isTermsAccepted: boolean = false;
  driverObjInit: any;
  tutorialShown: boolean = false;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private sharedService: SharedService
  ) {
    this.driverObjInit = driver({
      showProgress: false,
      steps: [
        {
          element: '#titulo',
          popover: {
            title: 'Información importante',
            description:
              'Esta aplicación permite calcular los ahorros económicos y en emisiones, de la instalación de generación distribuida solar en hogares, comercios o industrias',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
           /* prevBtnText: 'Anterior',*/
            doneBtnText: 'Terminar',
          },
        },
        {
          element: '#ubicacion',
          popover: {
            title: 'Ubicación',
            description:
              'Debe indicarse el lugar donde se planea instalar los paneles fotovoltaicos. Puede buscar la dirección del lugar, o seleccionar en el mapa.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: '#consumo',
          popover: {
            title: 'Consumo de electricidad y categoría tarifaria',
            description:
              'Deben seleccionarse la categoría del suministro eléctrico donde se quiere instalar equipamiento de Generación Distribuida, y consumos de electricidad registrados en los 12 últimos meses.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: '#consumoAdvertencia',
          popover: {
            title: 'Consumo de electricidad y categoría tarifaria',
            description:
              'En caso de no contar la misma, se considerarán los valores promedios de consumo para la categoría tarifaria del suministro.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: '#ver-terminos',
          popover: {
            title: 'Para continuar debe aceptar los términos y condiciones',
            description:
              'La aplicación proporciona una estimación económica de la inversión necesaria por la instalación de paneles fotovoltaicos y los ahorros obtenidos, incluyendo el plazo previsto de recupero de la inversión.',
            side: 'left',
            align: 'start',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
      ],
    });
    
  }

  ngOnInit(): void {
    this.sharedService.tutorialShown$.subscribe((shown) => {
      this.tutorialShown = shown;
    });

  }

  ngAfterViewInit(): void {
    if (!this.tutorialShown) {
      setTimeout(() => {
        this.driverObjInit.drive();
      }, 50);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  goToPaso1() {
    if (this.isTermsAccepted) {
      this.router.navigate(['pasos/1']);
    } else {
      this.showTooltip();
    }
  }

  showTerms() {
    this.showModal = true;
  }

  handleAccepted(event: boolean) {
    this.showModal = false;
    this.isTermsAccepted = event;
  }

  showTooltip() {
    if (!this.isTermsAccepted) {
      this.snackBar.open(
        'Debe aceptar los términos y condiciones para continuar.',
        '',
        {
          duration: 5000,
          panelClass: ['custom-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
    }
  }

  hideTooltip(event: MouseEvent) {
    this.snackBar.dismiss();
  }

  openHelpModal(): void {
    this.dialog.open(InstruccionesComponent, {
      width: '500px',
    });
  }
}
