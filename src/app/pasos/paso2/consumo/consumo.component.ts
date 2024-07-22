import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MesesConsumo } from 'src/app/interfaces/mesesConsumo';
import { ConsumoService } from 'src/app/services/consumo.service';
import { SolarApiService } from 'src/app/services/solar-api.service';

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
  allCompleted: boolean = false;

  meses: MesesConsumo[] = [
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

  constructor(private consumoService: ConsumoService, private solarApiService: SolarApiService) {}

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
    event.preventDefault();

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

  esMesCompletado(mes: MesesConsumo): boolean {
    return mes.consumo !== null; // Determina si el mes está completado según el valor de consumo
  }

  calcularTotalConsumo(): void {
    const totalConsumo = this.meses.reduce(
      (sum, mes) => sum + (mes.consumo || 0),
      0
    );
    this.consumoService.setTotalConsumo(totalConsumo);
    this.checkAllFieldsCompleted();
    if(this.allCompleted) {
      localStorage.setItem('annualKWhEnergyConsumption', JSON.stringify(totalConsumo))
    }
  }

  checkAllFieldsCompleted(): void {
    this.allCompleted = this.meses.every(mes => mes.consumo !== null);
    this.allFieldsCompleted.emit(this.allCompleted);
    if(this.allCompleted){
      this.solarApiService.cargarConsumosAnuales(this.meses)
    }
  }
  
  onConsumoChange(): void {
    this.calcularTotalConsumo();
  }
}
