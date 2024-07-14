import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ConsumoService } from 'src/app/services/consumo.service';

interface MesConsumo {
  numero: number;
  consumo: any;
  completado: boolean; // Propiedad para determinar si el mes está completado
}
interface ResultadoCalculo {
  totalConsumo: number;
  categoria: string;
}

@Component({
  selector: 'app-consumo',
  templateUrl: './consumo.component.html',
  styleUrls: ['./consumo.component.css'],
})
export class ConsumoComponent implements OnInit {
  @Output() allFieldsCompleted = new EventEmitter<boolean>();

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
    { numero: 12, consumo: null, completado: false },
  ];
  resultado: ResultadoCalculo | null = null;
  totalConsumo: number = 0;

  constructor(private consumoService: ConsumoService) {}

  ngOnInit(): void {
    this.focusFirstInput();
    this.calcularTotalConsumo();
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
      const nextInput = document.getElementById(
        `input-${index}`
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.disabled = false;
        nextInput.focus();
      }
    }
  }

  esMesCompletado(mes: MesConsumo): boolean {
    return mes.consumo !== null; // Determina si el mes está completado según el valor de consumo
  }

  calcularTotalConsumo(): void {
    const totalConsumo = this.meses.reduce(
      (sum, mes) => sum + (mes.consumo || 0),
      0
    );
    this.consumoService.setTotalConsumo(totalConsumo);
    let categoria = '';
    if (totalConsumo < 1000) {
      categoria = 'Bajo';
    } else if (totalConsumo < 3000) {
      categoria = 'Medio';
    } else {
      categoria = 'Alto';
    }

    this.resultado = {
      totalConsumo,
      categoria,
    };
    localStorage.setItem('anualConsumo', JSON.stringify(this.resultado));
    console.log('Objeto con datos ingresados:', {
      meses: this.meses,
      totalConsumo,
      categoria,
    });
    this.checkAllFieldsCompleted();
  }

  checkAllFieldsCompleted(): void {
    const allCompleted = this.meses.every(mes => mes.consumo !== null);
    this.allFieldsCompleted.emit(allCompleted);
  }
  
  onConsumoChange(): void {
    this.calcularTotalConsumo();
  }
}
