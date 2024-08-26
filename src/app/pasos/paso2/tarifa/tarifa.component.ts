import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Tarifa } from 'src/app/interfaces/tarifa';
import { ConsumoTarifaService } from 'src/app/services/consumo-tarifa.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-tarifa',
  templateUrl: './tarifa.component.html',
  styleUrls: ['./tarifa.component.css'],
})
export class TarifaComponent implements OnInit {
  
  tarifaContratada: string = '';
  consumosMensuales: number[] = [];
  potenciaMaxAsignada: number = 0;
  inputPotenciaContratada: number | null = null;

  @Output() isCategorySelected = new EventEmitter<boolean>(false);
  @ViewChild('tarifaSelect') tarifaSelect!: ElementRef;

  tarifas: Tarifa[] = [
    {
      value: 'T1-R',
      viewValue: 'Pequeña Demanda Residencial (T1-R1, T1-R2 o T1-R3)',
      potenciaMaxAsignada: 10,
    },
    {
      value: 'T1-G',
      viewValue: 'Pequeña Demanda General (T1-G1, T1-G2 o T1-G3)',
      potenciaMaxAsignada: 10,
    },
    {
      value: 'T2-SMP',
      viewValue: 'Mediana Demanda sin Medición de Potencia (T2-SMP)',
      potenciaMaxAsignada: 20,
    },
    {
      value: 'T2-CMP',
      viewValue: 'Mediana Demanda con Medición de Potencia (T2-CMP)',
      potenciaMaxSugerida: 25,
      potenciaMaxAsignada: 35,
    },
    {
      value: 'T3-BT',
      viewValue: 'Grande Demanda en Baja Tensión (T3-BT)',
      potenciaMaxSugerida: 95,
      potenciaMaxAsignada: 50,
    },
    {
      value: 'T3-MT13.2R',
      viewValue: 'Grande Demanda en Media Tensión (T3-MT13,2 kV, T3-MT 33 kV)',
      potenciaMaxSugerida: 155,
      potenciaMaxAsignada: 50,
    },
    {
      value: 'TRA-SD',
      viewValue: 'Riego Agrícola (TRA-SD)',
      potenciaMaxSugerida: 55,
      potenciaMaxAsignada: 35,
    },
  ];

  constructor(
    private sharedService: SharedService,
    private consumoTarifaService: ConsumoTarifaService
  ) {}

  ngOnInit(): void {
    this.tarifaContratada = this.sharedService.getTarifaContratada();
    this.sharedService.potenciaMaxAsignada$.subscribe({
      next: (potencia) => {
        this.potenciaMaxAsignada = potencia;
      },
    });
  }

  ngAfterViewInit(): void {
   
  }

  isOptionSelected(): boolean {
    return this.tarifaContratada !== '';
  }

  onTarifaChange(): void {
    this.sharedService.setTarifaContratada(this.tarifaContratada);
    this.isCategorySelected.emit(this.isOptionSelected());
    this.updateConsumosMensuales();

    const tarifaSeleccionada = this.tarifas.find(
      (tarifa) => tarifa.value === this.tarifaContratada
    );

    if (tarifaSeleccionada) {
      this.potenciaMaxAsignada = tarifaSeleccionada.potenciaMaxAsignada;
      this.sharedService.setPotenciaMaxAsignada(tarifaSeleccionada.potenciaMaxAsignada);
      this.inputPotenciaContratada = this.potenciaMaxAsignada;
    }
  }

  updateConsumosMensuales(): void {
    this.consumosMensuales = this.consumoTarifaService.getConsumoMensual(
      this.tarifaContratada
    );
  }

  isPotenciaMaxDisabled(): boolean {
    return this.potenciaMaxAsignada === 10 || this.potenciaMaxAsignada === 20;
  }

  onPotenciaInputChange(): void {
    if (this.potenciaMaxAsignada < 0) {
      this.potenciaMaxAsignada = 0;
    }
  }
  
}
