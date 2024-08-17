import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-instrucciones',
  templateUrl: './instrucciones.component.html',
  styleUrls: ['./instrucciones.component.css']
})
export class InstruccionesComponent {
  constructor(public dialogRef: MatDialogRef<InstruccionesComponent>) {}

  closeModal(): void {
    this.dialogRef.close();
  }
}