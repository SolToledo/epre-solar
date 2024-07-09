import { Component, OnInit } from '@angular/core';

interface MesConsumo {
  numero: number;
  consumo: any;
  completado: boolean; // Propiedad para determinar si el mes está completado
}

@Component({
  selector: 'app-consumo',
  templateUrl: './consumo.component.html',
  styleUrls: ['./consumo.component.css']
})
export class ConsumoComponent implements OnInit {
  meses: MesConsumo[] = [
    { numero: 1, consumo: null, completado: false },
    { numero: 2, consumo: null, completado: false },
    { numero: 3, consumo: null, completado: false },
    { numero: 4, consumo: null, completado: false },
    { numero: 5, consumo: null, completado: false },
    { numero: 6, consumo: null, completado: false },
    { numero: 7, consumo: null, completado: false },
    { numero: 8, consumo: null, completado: false },
    { numero: 9, consumo: null, completado: false },
    { numero: 10, consumo: null, completado: false },
    { numero: 11, consumo: null, completado: false },
    { numero: 12, consumo: null, completado: false }
  ];

  constructor() {}

  ngOnInit(): void {
    this.focusFirstInput();
  }

  focusFirstInput(): void {
    setTimeout(() => {
      const firstInput = document.getElementById(`input-0`) as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 0);
  }

  focusNextInput(event: any, index: number): void {
    event.preventDefault(); // Evitar comportamiento por defecto al presionar enter

    if (index < this.meses.length) {
      const nextInput = document.getElementById(`input-${index}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.disabled = false;
        nextInput.focus();
      }
    }
  }

  esMesCompletado(mes: MesConsumo): boolean {
    return mes.consumo !== null; // Determina si el mes está completado según el valor de consumo
  }
}
