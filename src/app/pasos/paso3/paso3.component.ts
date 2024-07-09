import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-paso3',
  templateUrl: './paso3.component.html',
  styleUrls: ['./paso3.component.css']
})
export class Paso3Component {
  currentStep: number = 3;
  mostrarModal: boolean = false;

  constructor(private router: Router) {}

  print(): void {
    window.print();
  }

  downloadPDF(): void {
    // Lógica para descargar el contenido como PDF
  }

  sendEmail(): void {
    // Lógica para enviar el contenido por correo
  }

  mostrarAdvertencia(): void {
    this.mostrarModal = true;
  }

  cancelarSalir(): void {
    this.mostrarModal = false;
  }

  confirmarSalir(): void {
    this.mostrarModal = false;
    this.router.navigateByUrl('/pasos/0', { skipLocationChange: true }).then(() => {
      this.router.navigate(['/pasos/0']);
    });
  }

  goBack() {
    this.router.navigate(['pasos/2']);
  }
}
