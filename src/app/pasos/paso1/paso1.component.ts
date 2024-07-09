import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-paso1',
  templateUrl: './paso1.component.html',
  styleUrls: ['./paso1.component.css']
})
export class Paso1Component {
  currentStep: number = 1;
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/pasos/0']);
  }

  goToPaso2() {
    this.router.navigate(['/pasos/2']);
  }
}
