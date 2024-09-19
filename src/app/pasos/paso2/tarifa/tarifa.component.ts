import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  LOCALE_ID,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Tarifa } from 'src/app/interfaces/tarifa';
import { ConsumoTarifaService } from 'src/app/services/consumo-tarifa.service';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';
import { TarifaDialogComponent } from './tarifa-dialog/tarifa-dialog.component';
import { DecimalPipe } from '@angular/common';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-tarifa',
  templateUrl: './tarifa.component.html',
  styleUrls: ['./tarifa.component.css'],
  providers: [DecimalPipe],
})
export class TarifaComponent implements OnInit, AfterViewInit {
  tarifaContratada: string = '';
  consumosMensuales: number[] = [];
  potenciaMaxAsignadakW!: number;
  inputPotenciaContratada: number | null = null;
  private isDialogOpen: boolean = false;

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
      value: 'T3-MT 13.2R',
      viewValue: 'Grande Demanda en Media Tensión (T3-MT 13,2 kV, T3-MT 33 kV)',
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
  formattedValue: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private sharedService: SharedService,
    private consumoTarifaService: ConsumoTarifaService,
    private mapService: MapService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private decimalPipe: DecimalPipe
  ) {}

  ngOnInit(): void {
    this.sharedService.tarifaContratada$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tarifa) => {
        this.tarifaContratada = tarifa;
        if (this.tarifaContratada && !this.isDialogOpen) {
          this.updatePotenciaMaxAsignada();
          this.checkPotenciaExcedida();
        }
      });

    this.sharedService.potenciaMaxAsignadaW$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newPotenciaMax) => {
            this.potenciaMaxAsignadakW = newPotenciaMax / 1000;
            if(!this.isDialogOpen) {
              this.checkPotenciaExcedida();
            }
        },
      });

    this.sharedService.potenciaInstalacionW$
      .pipe(takeUntil(this.destroy$))
      .subscribe((potencia) => {
        console.log('Nueva potencia instalada:', potencia);
        if(!this.isDialogOpen) {
          this.checkPotenciaExcedida();
        }
      });

    this.mapService.panelsRedrawn$
      .pipe(takeUntil(this.destroy$))
      .subscribe((panelesCantidad) => {
        this.sharedService.setPanelsCountSelected(panelesCantidad);
        this.updateConsumosMensuales();
      });

    this.sharedService.panelsCountSelected$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((count) => {
        console.log('Nuevo conteo de paneles recibido:', count);
        if(!this.isDialogOpen) {
          this.checkPotenciaExcedida();
        }
      });
  }

  ngAfterViewInit(): void {}

  isOptionSelected(): boolean {
    return this.tarifaContratada !== '';
  }

  onTarifaChange(): void {
    console.log('Iniciando onTarifaChange');
    console.log('Tarifa contratada:', this.tarifaContratada);

    this.updatePotenciaMaxAsignada();
    console.log('Después de updatePotenciaMaxAsignada');

    const tarifaSeleccionada = this.tarifas.find(
      (tarifa) => tarifa.value === this.tarifaContratada
    );
    console.log('Tarifa seleccionada:', tarifaSeleccionada);

    if (tarifaSeleccionada) {
      this.potenciaMaxAsignadakW = tarifaSeleccionada.potenciaMaxAsignadakW;
      console.log('Potencia máxima asignada (kW):', this.potenciaMaxAsignadakW);

      this.sharedService.setPotenciaMaxAsignadaW(
        this.potenciaMaxAsignadakW * 1000
      );
      console.log(
        'Potencia máxima asignada (W):',
        this.potenciaMaxAsignadakW * 1000
      );

      this.sharedService.setTarifaContratada(this.tarifaContratada);
      console.log('Tarifa contratada actualizada en SharedService');

      const isSelected = this.isOptionSelected();
      console.log('¿Opción seleccionada?', isSelected);
      this.isCategorySelected.emit(isSelected);

      this.calcularMaxPanelsPerMaxPotencia();
      console.log('Después de calcularMaxPanelsPerMaxPotencia');

      this.updateConsumosMensuales();
      console.log('Después de updateConsumosMensuales');

      if(!this.isDialogOpen) {
        this.checkPotenciaExcedida();
      }
      console.log('Después de checkPotenciaExcedida');
    } else {
      console.log('No se encontró una tarifa seleccionada');
    }

    console.log('Finalizando onTarifaChange');
  }

  getMaxPotenciaPermitida(): number {
    if (['T3-BT', 'T3-MT 13.2R', 'TRA-SD'].includes(this.tarifaContratada)) {
      return 2000; // 2000 kW
    }
    return this.sharedService.getPotenciaMaxAsignadaValue();
  }

  openDialog(): void {
    if (this.isDialogOpen) {
      return; // Si ya hay un diálogo abierto, no abrir otro
    }
    this.isDialogOpen = true;

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
        message: `
  La potencia de la instalación configurada de ${this.decimalPipe.transform(
    this.sharedService.getPotenciaInstalacionW() / 1000,
    '1.2-2'
  )} kWh, supera la potencia máxima de ${this.decimalPipe.transform(
    this.potenciaMaxAsignadakW,
    '1.0-0'
  )} kW 
  asignada para la tarifa seleccionada. Presione aceptar para adecuar la cantidad de paneles a la potencia contratada o cancelar 
  para volver al paso anterior y elegir otra superficie.`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      
      if (result) {
        this.isDialogOpen = false;
        this.calcularMaxPanelsPerMaxPotencia();
        
        this.mapService.reDrawPanels(this.sharedService.getPanelsSelected());
      } else {
        this.sharedService.setTarifaContratada('');
        this.sharedService.setTutorialShown(true);
        this.mapService.clearDrawing();
        this.sharedService.resetAll();
        this.isDialogOpen = false;
        this.router.navigate(['pasos/1']);
      }
    });
  }
  private calcularMaxPanelsPerMaxPotencia() {
    const panelCapacity = this.sharedService.getPanelCapacityW();
    const maxPotenciaContratada =
      this.sharedService.getPotenciaMaxAsignadaValue();
    const maxPanelsPerMaxPotencia = maxPotenciaContratada / panelCapacity;
    if (
      maxPanelsPerMaxPotencia >= this.sharedService.getMaxPanelsPerSuperface()
    ) {
      this.sharedService.setPanelsCountSelected(
        this.sharedService.getMaxPanelsPerSuperface()
      );
    } else {
      this.sharedService.setPanelsCountSelected(maxPanelsPerMaxPotencia);
    }
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
    console.log('Iniciando onPotenciaInputChange');
    console.log(
      'Valor inicial de potenciaMaxAsignadakW:',
      this.potenciaMaxAsignadakW
    );
    console.log('Tarifa contratada:', this.tarifaContratada);

    if (this.potenciaMaxAsignadakW < 0) {
      this.potenciaMaxAsignadakW = 0;
      console.log('Potencia ajustada a 0 por ser negativa');
    }

    if (this.tarifaContratada === 'T2-CMP') {
      this.potenciaMaxAsignadakW = Math.max(
        20,
        Math.min(this.potenciaMaxAsignadakW, 50)
      );
      console.log('Potencia ajustada para T2-CMP:', this.potenciaMaxAsignadakW);
    } else if (
      ['T3-BT', 'T3-MT 13.2R', 'TRA-SD'].includes(this.tarifaContratada)
    ) {
      console.log('Tarifa en grupo especial:', this.tarifaContratada);
      if (
        this.potenciaMaxAsignadakW < 50 &&
        this.tarifaContratada !== 'TRA-SD'
      ) {
        this.potenciaMaxAsignadakW = 50;
        console.log('Potencia ajustada a 50 para T3-BT o T3-MT 13.2R');
      } else if (
        this.tarifaContratada === 'TRA-SD' &&
        this.potenciaMaxAsignadakW < 10
      ) {
        this.potenciaMaxAsignadakW = 10;
        console.log('Potencia ajustada a 10 para TRA-SD');
      }
    }

    console.log('Potencia final en kW:', this.potenciaMaxAsignadakW);
    this.sharedService.setPotenciaMaxAsignadaW(
      this.potenciaMaxAsignadakW * 1000
    );
    console.log(
      'Potencia enviada al SharedService en W:',
      this.potenciaMaxAsignadakW * 1000
    );

    if(!this.isDialogOpen) {
      this.checkPotenciaExcedida();
    }
    console.log('Finalizado onPotenciaInputChange');
  }

  getRangoPotenciaMensaje(): string {
    switch (this.tarifaContratada) {
      case 'T2-CMP':
        return 'Ingrese un valor entre 20 kW y 50 kW';
      case 'T3-BT':
      case 'T3-MT 13.2R':
        return 'Ingrese un valor mayor a 50 kW';
      case 'TRA-SD':
        return 'Ingrese un valor mayor a 10 kW';
      default:
        return `Potencia Máxima asignada: ${this.potenciaMaxAsignadakW} kW`;
    }
  }

  getPotenciaMinimakW(): number {
    switch (this.tarifaContratada) {
      case 'T2-CMP':
        return 20;
      case 'T3-BT':
      case 'T3-MT 13.2R':
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
        return 50;
      case 'T3-BT':
      case 'T3-MT 13.2R':
      case 'TRA-SD':
        return 2000;
      default:
        return null;
    }
  }

  onSliderChange(event: any): void {
    console.log('Iniciando onSliderChange');
    console.log('Evento recibido:', event);

    const value = event.target.value;
    console.log('Valor extraído del evento:', value);

    if (!isNaN(value)) {
      console.log('El valor es un número válido');

      this.potenciaMaxAsignadakW = Math.round(value);
      console.log(
        'Potencia máxima asignada (kW) redondeada:',
        this.potenciaMaxAsignadakW
      );

      this.onPotenciaInputChange();
      console.log('Después de llamar a onPotenciaInputChange()');

      this.sharedService.setPotenciaMaxAsignadaW(
        this.potenciaMaxAsignadakW * 1000
      );
      console.log(
        'Potencia máxima asignada (W) enviada al SharedService:',
        this.potenciaMaxAsignadakW * 1000
      );

      if(!this.isDialogOpen) {
        this.checkPotenciaExcedida();
      }
      console.log('Después de llamar a checkPotenciaExcedida()');

      this.cdr.detectChanges();
      console.log('Detección de cambios forzada');
    } else {
      console.log('El valor no es un número válido');
    }

    console.log('Finalizando onSliderChange');
  }

  formatLabel(value: number): string {
    return new Intl.NumberFormat('es-ES').format(value * 1000);
  }

  private updatePotenciaMaxAsignada(): void {
    const tarifaSeleccionada = this.tarifas.find(
      (t) => t.value === this.tarifaContratada
    );
    if (tarifaSeleccionada) {
      this.potenciaMaxAsignadakW = tarifaSeleccionada.potenciaMaxAsignadakW;
      this.sharedService.setPotenciaMaxAsignadaW(
        this.potenciaMaxAsignadakW * 1000
      );
    }
  }

  private checkPotenciaExcedida(): void {
    const panelsCount = this.sharedService.getPanelsSelected();
    const panelCapacity = this.sharedService.getPanelCapacityW();
    const potenciaInstalada = panelsCount * panelCapacity;
    const potenciaMaxAsignada = this.potenciaMaxAsignadakW * 1000;

    console.log('Verificando potencia excedida:');
    console.log('Cantidad de paneles:', panelsCount);
    console.log('Capacidad por panel:', panelCapacity);
    console.log('Potencia instalada:', potenciaInstalada);
    console.log('Potencia máxima asignada:', potenciaMaxAsignada);

    if (potenciaMaxAsignada > 0 && potenciaInstalada > potenciaMaxAsignada && !this.isDialogOpen) {
      console.log('Abriendo diálogo de potencia excedida');
      this.openDialog();
    } else {
      console.log('No se necesita abrir el diálogo');
      console.log(
        'Razón:',
        potenciaMaxAsignada <= 0
          ? 'Potencia máxima no asignada'
          : 'Potencia instalada no excede el máximo'
      );
    }
  }
}
