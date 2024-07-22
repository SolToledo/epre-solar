import { Component, Input, OnInit } from '@angular/core';
import { ConsumoService } from 'src/app/services/consumo.service';

interface Tarifa {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-tarifa',
  templateUrl: './tarifa.component.html',
  styleUrls: ['./tarifa.component.css'],
})
export class TarifaComponent implements OnInit {
  tarifaContratada: string = '';
  @Input()
  allFieldsFilled!: boolean;

  constructor(private consumoService: ConsumoService) {}

  ngOnInit(): void {
    this.consumoService.categoria$.subscribe((categoria) => {
      this.tarifaContratada = categoria;
    });
  }
}
