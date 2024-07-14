import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-paso2',
  templateUrl: './paso2.component.html',
  styleUrls: ['./paso2.component.css']
})
export class Paso2Component {
  currentStep: number = 2;
  allFieldsFilled: boolean = false;

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['pasos/1']);
  }

  goToPaso3() {
    this.router.navigate(['pasos/3']);
  }

  onAllFieldsCompleted(event: boolean): void {
    this.allFieldsFilled = event;
  }
}
