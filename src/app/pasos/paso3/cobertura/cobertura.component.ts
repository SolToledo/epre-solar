import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-cobertura',
  templateUrl: './cobertura.component.html',
  styleUrls: ['./cobertura.component.css']
})
export class CoberturaComponent {
  @Input()
  proporcionAutoconsumo: number = 80;
}
