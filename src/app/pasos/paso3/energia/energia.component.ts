import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-energia',
  templateUrl: './energia.component.html',
  styleUrls: ['./energia.component.css']
})
export class EnergiaComponent {

  @Input() yearlyEnergyAcKwh: number = 0;
}
