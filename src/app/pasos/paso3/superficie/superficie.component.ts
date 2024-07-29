import { Component } from '@angular/core';

@Component({
  selector: 'app-superficie',
  templateUrl: './superficie.component.html',
  styleUrls: ['./superficie.component.css']
})
export class SuperficieComponent {
  selectedAreaM2!: number;

  constructor() {
    const item = localStorage.getItem("selectedAreaM2");
    this.selectedAreaM2 = item ? JSON.parse(item).value.toFixed(2) : {};
  }
  
}
