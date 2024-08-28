import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
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
    private consumoTarifaService: ConsumoTarifaService,
    private mapService: MapService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.tarifaContratada = this.sharedService.getTarifaContratada() ?? '';

    this.sharedService.potenciaMaxAsignada$.subscribe({
      next: (newPotenciaMax) => {
        this.potenciaMaxAsignada = newPotenciaMax;
      },
    });
  }

  ngAfterViewInit(): void {}

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
      this.sharedService.setPotenciaMaxAsignada(
        this.potenciaMaxAsignada * 1000
      );

      if (
        this.sharedService.getPotenciaInstalacion() >
        this.sharedService.getPotenciaMaxAsignadaValue()
      ) {
        this.openDialog();
      } else {
        this.inputPotenciaContratada = this.potenciaMaxAsignada * 1000;
        this.sharedService.setIsStopCalculate(false);
      }
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(TarifaDialogComponent, {
      width: '60%',
      height: '',
      minWidth: '',
      maxWidth: '',
      minHeight: '',
      maxHeight: '',
      position: { top: '', bottom: '', left: '', right: '' },
      disableClose: true,
      hasBackdrop: true,
      backdropClass: '',
      panelClass: [''],
      autoFocus: true,
      closeOnNavigation: false,
      data: {
        message: `La superficie seleccionada admite ${this.sharedService.getMaxPanelsPerSuperface()} paneles, con una potencia total de la instalación de ${this.sharedService.getPotenciaInstalacion()} Kw, superando la potencia máxima de ${
          this.potenciaMaxAsignada
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
          this.sharedService.setPotenciaInstalacion(0);
          this.sharedService.setPotenciaMaxAsignada(0);
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
    if (this.potenciaMaxAsignada < 0) {
      this.potenciaMaxAsignada = 0;
    }
  }
}
