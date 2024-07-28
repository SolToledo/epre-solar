import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-plazo',
  templateUrl: './plazo.component.html',
  styleUrls: ['./plazo.component.css']
})
export class PlazoComponent {

  @Input()
  plazoRecuperoInversion: number = 0;
}
