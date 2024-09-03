import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Tarifa } from 'src/app/interfaces/tarifa';
import { ConsumoTarifaService } from 'src/app/services/consumo-tarifa.service';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';
import { TarifaDialogComponent } from './tarifa-dialog/tarifa-dialog.component';

@Component({
  selector: 'app-tarifa',
  templateUrl: './tarifa.component.html',
  styleUrls: ['./tarifa.component.css'],
})
export class TarifaComponent implements OnInit, AfterViewInit {
  tarifaContratada: string = '';
  consumosMensuales: number[] = [];
  potenciaMaxAsignadakW: number = 0;
  inputPotenciaContratada: number | null = null;

  @Output() isCategorySelected = new EventEmitter<boolean>(false);
  @ViewChild('tarifaSelect') tarifaSelect!: ElementRef;
  tarifas: Tarifa[] = [
    {
      value: 'T1-R',
      viewValue: 'Pequeña Demanda Residencial (T1-R1, T1-R2 o T1-R3)',
      potenciaMaxAsignadakW: 10,
    },
    {
      value: 'T1-G',
      viewValue: 'Pequeña Demanda General (T1-G1, T1-G2 o T1-G3)',
      potenciaMaxAsignadakW: 10,
    },
    {
      value: 'T2-SMP',
      viewValue: 'Mediana Demanda sin Medición de Potencia (T2-SMP)',
      potenciaMaxAsignadakW: 20,
    },
    {
      value: 'T2-CMP',
      viewValue: 'Mediana Demanda con Medición de Potencia (T2-CMP)',
      potenciaMaxSugerida: 25,
      potenciaMaxAsignadakW: 35,
      potenciaMaxMinima: 20,
      potenciaMaxMaxima: 50,
    },
    {
      value: 'T3-BT',
      viewValue: 'Grande Demanda en Baja Tensión (T3-BT)',
      potenciaMaxSugerida: 95,
      potenciaMaxAsignadakW: 50,
      potenciaMaxMinima: 50,
    },
    {
      value: 'T3-MT13.2R',
      viewValue: 'Grande Demanda en Media Tensión (T3-MT13,2 kV, T3-MT 33 kV)',
      potenciaMaxSugerida: 155,
      potenciaMaxAsignadakW: 50,
      potenciaMaxMinima: 50,
    },
    {
      value: 'TRA-SD',
      viewValue: 'Riego Agrícola (TRA-SD)',
      potenciaMaxSugerida: 55,
      potenciaMaxAsignadakW: 35,
      potenciaMaxMinima: 10,
    },
  ];

  constructor(
    private sharedService: SharedService,
    private consumoTarifaService: ConsumoTarifaService,
    private mapService: MapService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.tarifaContratada = this.sharedService.getTarifaContratada() ?? '';

    this.sharedService.potenciaMaxAsignada$.subscribe({
      next: (newPotenciaMax) => {
        this.potenciaMaxAsignadakW = newPotenciaMax / 1000;
      },
    });
  }

  ngAfterViewInit(): void {}

  isOptionSelected(): boolean {
    return this.tarifaContratada !== '';
  }

  onTarifaChange(): void {
    const tarifaSeleccionada = this.tarifas.find(
      (tarifa) => tarifa.value === this.tarifaContratada
    );
    if (tarifaSeleccionada) {
      this.potenciaMaxAsignadakW = tarifaSeleccionada.potenciaMaxAsignadakW;
      if (
        this.potenciaMaxAsignadakW * 1000 <
        this.sharedService.getPotenciaInstalacionW()
      ) {
        console.log(
          'redibujar la cantidad de paneles acorde a la potencia maxima contratada'
        );
        this.sharedService.setIsStopCalculate(true);
        this.sharedService.setConsumosMensuales([]);
      } else {
        this.sharedService.setTarifaContratada(this.tarifaContratada);
        this.isCategorySelected.emit(this.isOptionSelected());
        this.sharedService.setPotenciaMaxAsignadaW(
          this.potenciaMaxAsignadakW * 1000
        );
        this.sharedService.setIsStopCalculate(false);
        this.updateConsumosMensuales();
      }
    }
  }

  getMaxPotenciaPermitida(): number {
    if (['T3-BT', 'T3-MT13.2R', 'TRA-SD'].includes(this.tarifaContratada)) {
      return 2000; // 2000 kW
    }
    return this.sharedService.getPotenciaMaxAsignadaValue();
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(TarifaDialogComponent, {
      /* width: '30%',*/
      width: '400px',
      height: '',
      minWidth: '400px',
      maxWidth: '',
      minHeight: '',
      maxHeight: '',
      position: { top: '', bottom: '', left: '', right: '' },
      disableClose: true,
      hasBackdrop: true,
      panelClass: 'responsive-dialog', // Clase personalizada
      backdropClass: 'responsive-backdrop', // Clase personalizada
      autoFocus: true,
      closeOnNavigation: false,
      data: {
        message: `La superficie seleccionada admite ${this.sharedService.getMaxPanelsPerSuperface()} paneles, con una potencia total de la instalación de ${this.sharedService.getPotenciaInstalacionW()} Kw, superando la potencia máxima de ${
          this.potenciaMaxAsignadakW
        } Kw asignada para su tarifa contratada. Aceptar para editar la superficie o cancelar para elegir una nueva ubicación.`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.mapService.setDrawingMode(null);
        this.mapService.getPolygons()[0].setEditable(true);
        this.sharedService.setIsStopCalculate(true);
      } else {
        this.sharedService.setTutorialShown(true);
        this.router.navigate(['pasos/1']).then(() => {
          this.mapService.clearDrawing();
          this.sharedService.setMaxPanelsPerSuperface(0);
          this.sharedService.setPotenciaInstalacionW(0);
          this.sharedService.setPotenciaMaxAsignadaW(0);
          this.sharedService.setTarifaContratada('');
        });
      }
    });
  }

  updateConsumosMensuales(): void {
    this.consumosMensuales = this.consumoTarifaService.getConsumoMensual(
      this.tarifaContratada
    );
  }

  isPotenciaMaxDisabled(): boolean {
    const tarifasDeshabilitadas = ['T1-R', 'T1-G', 'T2-SMP'];
    return tarifasDeshabilitadas.some((tarifa) =>
      this.tarifaContratada.includes(tarifa)
    );
  }

  onPotenciaInputChange(): void {
    if (this.potenciaMaxAsignadakW < 0) {
      this.potenciaMaxAsignadakW = 0;
      // return;
    }

    if (this.tarifaContratada === 'T2-CMP') {
      this.potenciaMaxAsignadakW = Math.max(
        20,
        Math.min(this.potenciaMaxAsignadakW, 50)
      );
    } else if (
      ['T3-BT', 'T3-MT13.2R', 'TRA-SD'].includes(this.tarifaContratada)
    ) {
      if (
        this.potenciaMaxAsignadakW < 50 &&
        this.tarifaContratada !== 'TRA-SD'
      ) {
        this.potenciaMaxAsignadakW = 50;
      } else if (
        this.tarifaContratada === 'TRA-SD' &&
        this.potenciaMaxAsignadakW < 10
      ) {
        this.potenciaMaxAsignadakW = 10;
      }
    }
  }

  getRangoPotenciaMensaje(): string {
    switch (this.tarifaContratada) {
      case 'T2-CMP':
        return 'Ingrese un valor entre 20 kW y 50 kW';
      case 'T3-BT':
      case 'T3-MT13.2R':
        return 'Ingrese un valor mayor a 50 kW';
      case 'TRA-SD':
        return 'Ingrese un valor mayor a 10 kW';
      default:
        return `Máxima asignada: ${this.potenciaMaxAsignadakW} kW`;
    }
  }

  getPotenciaMinimakW(): number {
    switch (this.tarifaContratada) {
      case 'T2-CMP':
        return 20;
      case 'T3-BT':
      case 'T3-MT13.2R':
        return 50;
      case 'TRA-SD':
        return 10;
      default:
        return 0;
    }
  }

  getPotenciaMaximakW(): number | null {
    switch (this.tarifaContratada) {
      case 'T2-CMP':
        return 50; //
      case 'T3-BT':
      case 'T3-MT13.2R':
      case 'TRA-SD':
        return 2000; // 2000 kW en watts (máximo permitido por ley)
      default:
        return null;
    }
  }

  onSliderChange(event: any): void {
    const value = event.value as number;
    if (!isNaN(value)) {
      this.potenciaMaxAsignadakW = Math.round(value);
      this.onPotenciaInputChange();
    }
  }
}
