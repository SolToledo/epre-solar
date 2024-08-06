import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ConsumoTarifaService } from 'src/app/services/consumo-tarifa.service';
import { SharedService } from 'src/app/services/shared.service';

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
  consumosMensuales: number[] = [];
  @Output() isCategorySelected = new EventEmitter<boolean>(false);
  @ViewChild('tarifaSelect') tarifaSelect!: ElementRef;

  tarifas: Tarifa[] = [
    {
      value: 'T1-R',
      viewValue: 'Pequeña Demanda Residencial (T1-R1, T1-R2 o T1-R3)',
    },
    {
      value: 'T1-G',
      viewValue: 'Pequeña Demanda General (T1-G1, T1-G2 o T1-G3)',
    },
    {
      value: 'T2-SMP',
      viewValue: 'Mediana Demanda sin Medición de Potencia (T2-SMP)',
    },
    {
      value: 'T2-CMP',
      viewValue: 'Mediana Demanda con Medición de Potencia (T2-CMP)',
    },
    { value: 'T3-BT', viewValue: 'Grande Demanda en Baja Tensión (T3-BT)' },
    {
      value: 'T3-MT13.2R',
      viewValue: 'Grande Demanda en Media Tensión (T3-MT13,2 kV, T3-MT 33 kV)',
    },
    { value: 'TRA-SD', viewValue: 'Riego Agrícola (TRA-SD)' },
  ];

  constructor(
    private sharedService: SharedService,
    private consumoTarifaService: ConsumoTarifaService
  ) {}

  ngOnInit(): void {
    this.tarifaContratada = this.sharedService.getTarifaContratada();
  }

  ngAfterViewInit(): void {}

  isOptionSelected(): boolean {
    return this.tarifaContratada !== '';
  }

  onTarifaChange(): void {
    this.sharedService.setTarifaContratada(this.tarifaContratada);
    localStorage.setItem(
      'categoriaSeleccionada',
      JSON.stringify(this.tarifaContratada)
    );
    this.isCategorySelected.emit(this.isOptionSelected());
    this.updateConsumosMensuales();
  }

  updateConsumosMensuales(): void {
    this.consumosMensuales = this.consumoTarifaService.getConsumoMensual(
      this.tarifaContratada
    );
    this.consumoTarifaService.updateConsumosMensuales(this.consumosMensuales);
  }
}
