import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-paso0',
  templateUrl: './paso0.component.html',
  styleUrls: ['./paso0.component.css']
})
export class Paso0Component {
  showModal: boolean = false;
  isTermsAccepted: boolean = false;

  constructor(private router: Router, private snackBar: MatSnackBar) {}

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
