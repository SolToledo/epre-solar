import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-costo',
  templateUrl: './costo.component.html',
  styleUrls: ['./costo.component.css']
})
export class CostoComponent {

  @Input()
  costoInstalacion: number = 3500;
}
