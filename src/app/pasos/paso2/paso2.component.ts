import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-paso2',
  templateUrl: './paso2.component.html',
  styleUrls: ['./paso2.component.css']
})
export class Paso2Component {
  currentStep: number = 2;
  allFieldsFilled: boolean = false;
  tarifaContratada: string = '';
  
  constructor(private router: Router, private snackBar: MatSnackBar) {}

  goBack() {
    this.router.navigate(['pasos/1']);
  }

  goToPaso3() {
    this.router.navigate(['pasos/3']);
  }

  onAllFieldsCompleted(event: boolean): void {
    this.allFieldsFilled = event;
  }

  showTooltip(event: MouseEvent) {
    if (!this.allFieldsFilled) {
      this.snackBar.open('Debe ingresar todos los meses para poder continuar.', '', {
        duration: 2000,
        panelClass: ['custom-snackbar']
      });
    }
  }

  hideTooltip(event: MouseEvent) {
    this.snackBar.dismiss();
  }
}
