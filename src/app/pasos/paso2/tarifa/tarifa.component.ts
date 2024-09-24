import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Tarifa } from 'src/app/interfaces/tarifa';
import { ConsumoTarifaService } from 'src/app/services/consumo-tarifa.service';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';
import { TarifaDialogComponent } from './tarifa-dialog/tarifa-dialog.component';
import { DecimalPipe } from '@angular/common';
import { distinctUntilChanged, Subject, takeUntil, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-tarifa',
  templateUrl: './tarifa.component.html',
  styleUrls: ['./tarifa.component.css'],
  providers: [DecimalPipe],
})
export class TarifaComponent implements OnInit, AfterViewInit, OnDestroy {
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
      potenciaMaxAsignadakW: 50,
      potenciaMaxMinima: 20,
      potenciaMaxMaxima: 50,
    },
    {
      value: 'T3-BT',
      viewValue: 'Grande Demanda en Baja Tensión (T3-BT)',
      potenciaMaxAsignadakW: 95,
      potenciaMaxMinima: 50,
    },
    {
      value: 'T3-MT 13.2R',
      viewValue: 'Grande Demanda en Media Tensión (T3-MT 13,2 kV, T3-MT 33 kV)',
      potenciaMaxAsignadakW: 155,
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
  seleccionUsuario: number = 0;
  maxPotenciaLegal: number = 2000;

  constructor(
    private sharedService: SharedService,
    private consumoTarifaService: ConsumoTarifaService,
    private mapService: MapService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.debug('Iniciando ngOnInit en TarifaComponent');

    this.sharedService.tarifaContratada$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((tarifa) => {
        console.debug('Nueva tarifa contratada recibida:', tarifa);
        this.tarifaContratada = tarifa;
        if (this.tarifaContratada && !this.isDialogOpen) {
          console.debug(
            'Actualizando potencia máxima asignada y verificando potencia excedida'
          );
          // Traza adicional para asegurarnos de que el valor correcto se esté asignando
          console.debug('Tarifa seleccionada:', this.tarifaContratada);
          console.debug('Potencia máxima asignada antes de actualización:', this.potenciaMaxAsignadakW);
  
          // Actualización lógica aquí (comentado temporalmente).
          // this.updatePotenciaMaxAsignada();
          // this.checkPotenciaExcedida();
        }
      });
  

      this.sharedService.potenciaMaxAsignadaW$
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
    .subscribe({
      next: (newPotenciaMax) => {
        console.debug(
          'Nueva potencia máxima asignada recibida (W):',
          newPotenciaMax
        );
        this.potenciaMaxAsignadakW = newPotenciaMax / 1000;

        // Verificar si la conversión a kW está funcionando correctamente
        console.debug(
          'Potencia máxima asignada convertida a kW:',
          this.potenciaMaxAsignadakW
        );
        if (!this.isDialogOpen && this.tarifaContratada) {
          console.debug('Verificando potencia excedida después de actualizar potencia máxima');
          // this.checkPotenciaExcedida();
        }
      },
    });

    this.sharedService.potenciaInstalacionW$
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
    .subscribe((potencia) => {
      console.debug('Nueva potencia instalada recibida:', potencia);

      // Traza para verificar la potencia instalada
      console.debug('Potencia instalada actual (W):', potencia);

      if (!this.isDialogOpen) {
        console.debug('Verificando potencia excedida con nueva potencia instalada');
        // this.checkPotenciaExcedida();
      }
    });

   
  this.mapService.panelsRedrawn$
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
    .subscribe((panelesCantidad) => {
      console.debug('Paneles redibujados, nueva cantidad:', panelesCantidad);

      // Trazar la cantidad de paneles recibidos al redibujar
      console.debug('Cantidad de paneles redibujados:', panelesCantidad);

      // this.sharedService.setPanelsCountSelected(panelesCantidad);
    });

    this.sharedService.panelsCountSelected$
    .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
    .subscribe((count) => {
      console.debug('Nuevo conteo de paneles recibido:', count);

      // Verificar el conteo de paneles seleccionado
      console.debug('Conteo actual de paneles seleccionados:', count);

      if (!this.isDialogOpen) {
        console.debug('Verificando potencia excedida con nuevo conteo de paneles');
        this.checkPotenciaExcedida();
      }
    });

    console.debug('Finalizando ngOnInit en TarifaComponent');
  }

  ngAfterViewInit(): void {
    const maxPotencia = this.getPotenciaMaximakW();

    // Verificar si la tarifa permite seleccionar la potencia máxima
    if (this.isTarifaConSeleccionDePotenciaMaxima(this.tarifaContratada)) {
      // Ajustamos el slider al máximo
      this.seleccionUsuario = maxPotencia;
      this.potenciaMaxAsignadakW = maxPotencia;

      // Actualizamos los paneles dibujados
      this.sharedService.setPotenciaMaxAsignadaW(maxPotencia * 1000);
      this.calcularMaxPanelsPerMaxPotencia();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isOptionSelected(): boolean {
    return this.tarifaContratada !== '';
  }
  isTarifaConSeleccionDePotenciaMaxima(tarifa: string): boolean {
    // Lista de tarifas que permiten seleccionar la potencia máxima
    const tarifasConSeleccion = ['T2-CMP', 'T3-BT', 'T3-MT 13.2R', 'TRA-SD'];
    return tarifasConSeleccion.includes(tarifa);
  }
  onTarifaChange(): void {
    console.debug('Iniciando onTarifaChange');
    console.debug('Tarifa contratada:', this.tarifaContratada);
    this.isDialogOpen = false;
    this.updatePotenciaMaxAsignada();
    console.debug('Después de updatePotenciaMaxAsignada');

    const tarifaSeleccionada = this.tarifas.find(
      (tarifa) => tarifa.value === this.tarifaContratada
    );
    console.debug('Tarifa seleccionada:', tarifaSeleccionada);

    if (tarifaSeleccionada) {
      this.potenciaMaxAsignadakW = tarifaSeleccionada.potenciaMaxAsignadakW;
      console.debug(
        'Potencia máxima asignada (kW):',
        this.potenciaMaxAsignadakW
      );

      this.sharedService.setPotenciaMaxAsignadaW(
        this.potenciaMaxAsignadakW * 1000
      );
      console.debug(
        'Potencia máxima asignada (W):',
        this.potenciaMaxAsignadakW * 1000
      );

      this.sharedService.setTarifaContratada(this.tarifaContratada);
      console.debug('Tarifa contratada actualizada en SharedService');

      const isSelected = this.isOptionSelected();
      console.debug('¿Opción seleccionada?', isSelected);
      this.isCategorySelected.emit(isSelected);

      this.calcularMaxPanelsPerMaxPotencia();
      console.debug('Después de calcularMaxPanelsPerMaxPotencia');

      this.updateConsumosMensuales();
      console.debug('Después de updateConsumosMensuales');

      const maxPotencia = this.getPotenciaMaximakW();
      if (this.isTarifaConSeleccionDePotenciaMaxima(this.tarifaContratada)) {
        this.seleccionUsuario = maxPotencia;
        this.potenciaMaxAsignadakW = maxPotencia;

        // Actualizamos la potencia en el servicio y recalculamos los paneles
        this.sharedService.setPotenciaMaxAsignadaW(maxPotencia * 1000);
        this.calcularMaxPanelsPerMaxPotencia();
      }

      if (!this.isDialogOpen) {
        this.checkPotenciaExcedida();
      }
      console.debug('Después de checkPotenciaExcedida');
    } else {
      console.debug('No se encontró una tarifa seleccionada');
    }

    console.debug('Finalizando onTarifaChange');
  }

  getMaxPotenciaPermitida(): number {
    if (['T3-BT', 'T3-MT 13.2R', 'TRA-SD'].includes(this.tarifaContratada)) {
      return this.maxPotenciaLegal; // 2000 kW
    }
    return this.sharedService.getPotenciaMaxAsignadaValue();
  }

  private async openDialog(
    potenciaInstalada: number,
    potenciaMaxAsignada: number
  ): Promise<void> {
    if (!this.isDialogOpen) {
      this.isDialogOpen = true;
      const dialogRef = this.dialog.open(TarifaDialogComponent, {
        width: '400px',
        minWidth: '400px',
        maxWidth: '',
        minHeight: '',
        maxHeight: '',
        position: { top: '', bottom: '', left: '', right: '' },
        disableClose: true,
        hasBackdrop: true,
        panelClass: 'responsive-dialog',
        backdropClass: 'responsive-backdrop',
        autoFocus: true,
        closeOnNavigation: false,
        data: {
          potenciaInstalada: potenciaInstalada,
          potenciaMaxAsignada: potenciaMaxAsignada,
          tarifaContratada: this.tarifaContratada,
        },
      });

      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result) {
        this.calcularMaxPanelsPerMaxPotencia();
        console.debug('Recalculando máximo de paneles');

        const panelsSelected = this.sharedService.getPanelsSelected();
        console.debug('Redibujando paneles, cantidad:', panelsSelected);
        this.mapService.reDrawPanels(panelsSelected);
      } else {
        // Lógica para volver al paso anterior
        console.debug('Reiniciando configuración');
        this.sharedService.setTarifaContratada('');
        this.sharedService.setTutorialShown(true);
        this.mapService.clearDrawing();
        this.sharedService.resetAll();
        this.isDialogOpen = false;
        console.debug('Navegando a paso 1 y reiniciando configuración');
        this.router.navigate(['pasos/1'], { replaceUrl: true });
      }
    }
  }

  private calcularMaxPanelsPerMaxPotencia(): void {
    console.debug('Iniciando calcularMaxPanelsPerMaxPotencia');

    const panelCapacityW = this.sharedService.getPanelCapacityW();
    const maxPotenciaContratadaW =
      this.sharedService.getPotenciaMaxAsignadaValue();

    // Calculamos cuántos paneles pueden instalarse por la potencia máxima contratada
    const maxPanelsPerMaxPotencia = Math.floor(
      maxPotenciaContratadaW / panelCapacityW
    );

    const panelsCountSelect = this.sharedService.getPanelsSelected();
    this.sharedService.setMaxPanelsPerSuperface(panelsCountSelect);
    const maxPanelsPerSurface = this.sharedService.getMaxPanelsPerSuperface();
    // Establecemos la cantidad de paneles a dibujar como el valor menor entre los paneles permitidos por potencia y superficie
    const panelesADibujar = Math.min(
      maxPanelsPerMaxPotencia,
      maxPanelsPerSurface,
      panelsCountSelect
    );

    console.debug('Paneles a dibujar:', panelesADibujar);

    // Actualizamos la cantidad de paneles y la potencia instalada en el servicio
    this.sharedService.setPanelsCountSelected(panelesADibujar);
    this.sharedService.setPotenciaInstalacionW(
      panelesADibujar * panelCapacityW
    );

    // Llamada al método que dibuja los paneles en el mapa
    this.mapService.reDrawPanels(panelesADibujar);

    console.debug('Finalizando calcularMaxPanelsPerMaxPotencia');
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
    console.debug('Iniciando onPotenciaInputChange');
    console.debug(
      'Valor inicial de potenciaMaxAsignadakW:',
      this.potenciaMaxAsignadakW
    );
    console.debug('Tarifa contratada:', this.tarifaContratada);
    const tarifaSeleccionada = this.tarifas.find(
      (t) => t.value === this.tarifaContratada
    );

    if (!tarifaSeleccionada) {
      console.debug('No se encontró la tarifa seleccionada');
      return;
    }
    if (['T1-R', 'T1-G', 'T2-SMP'].includes(this.tarifaContratada)) {
      // Para estas tarifas, asignamos directamente el valor máximo
      this.potenciaMaxAsignadakW = tarifaSeleccionada.potenciaMaxAsignadakW;
      console.debug(
        `Potencia máxima asignada para ${this.tarifaContratada}: ${this.potenciaMaxAsignadakW} kW`
      );
    } else if (
      ['T2-CMP', 'T3-BT', 'T3-MT 13.2R', 'TRA-SD'].includes(
        this.tarifaContratada
      )
    ) {
      // Para estas tarifas, utilizamos el valor del slider
      const potenciaMaxMinima = tarifaSeleccionada.potenciaMaxMinima || 0;

      /// Obtenemos el límite por superficie basado en la cantidad máxima de paneles que se pueden instalar
      const panelCapacityW = this.sharedService.getPanelCapacityW();
      this.sharedService.setMaxPanelsPerSuperface(this.sharedService.getPanelsSelected())
      const maxPanelsPerSurface = this.sharedService.getMaxPanelsPerSuperface();
      const potenciaMaxSuperficieKW =
        (maxPanelsPerSurface * panelCapacityW) / 1000;

      // Establecemos el máximo del slider como el valor menor entre el máximo legal y la potencia por superficie
      const maxPotenciaPermitidaKW = Math.min(
        this.maxPotenciaLegal,
        potenciaMaxSuperficieKW
      );
      // Si la tarifa tiene un `potenciaMaxMaxima`, usamos ese valor, si no, usamos el calculado
      const potenciaMaxMaxima =
        tarifaSeleccionada.potenciaMaxMaxima || maxPotenciaPermitidaKW;
      // Aseguramos que el slider esté dentro del rango permitido
      this.seleccionUsuario = Math.max(
        potenciaMaxMinima,
        Math.min(this.seleccionUsuario, potenciaMaxMaxima)
      );
      this.potenciaMaxAsignadakW = this.seleccionUsuario;

      console.debug(
        `Potencia ajustada para ${this.tarifaContratada}: ${this.potenciaMaxAsignadakW} kW`
      );
    }

    // Actualizamos la potencia máxima asignada en el servicio
    this.sharedService.setPotenciaMaxAsignadaW(
      this.potenciaMaxAsignadakW * 1000
    );
    console.debug(
      'Potencia seleccionada enviada al servicio:',
      this.potenciaMaxAsignadakW * 1000
    );

    this.calcularMaxPanelsPerMaxPotencia();

    if (!this.isDialogOpen) {
      this.checkPotenciaExcedida();
    }
    console.debug('Finalizado onPotenciaInputChange');
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

  getPotenciaMaximakW(): number {
    const maxPanelsPerSurface = this.sharedService.getMaxPanelsPerSuperface();
    const panelCapacityW = this.sharedService.getPanelCapacityW();

    // Potencia máxima en kW que puede generarse con el máximo de paneles en la superficie
    const potenciaMaximaSuperficieKW =
      (maxPanelsPerSurface * panelCapacityW) / 1000;

    // Definimos el máximo en función de la tarifa seleccionada
    const tarifaSeleccionada = this.tarifas.find(
      (t) => t.value === this.tarifaContratada
    );
    if (!tarifaSeleccionada) return 0;

    // Potencia máxima legal (2000 kW) o la potencia máxima de la tarifa si está definida
    const maxLegalKW = 2000;
    const potenciaMaxMaximaTarifa =
      tarifaSeleccionada.potenciaMaxMaxima || maxLegalKW;

    // Retornamos el valor mínimo entre el máximo legal/tarifa y lo que puede soportar la superficie
    return Math.min(potenciaMaxMaximaTarifa, potenciaMaximaSuperficieKW);
  }

  onSliderChange(event: any): void {
    console.debug('Iniciando onSliderChange');
    console.debug('Evento recibido:', event);

    const value = event.target.value;
    console.debug('Valor extraído del evento:', value);

    if (!isNaN(value)) {
      console.debug('El valor es un número válido');

      this.potenciaMaxAsignadakW = Math.round(value);
      console.debug(
        'Potencia máxima asignada (kW) redondeada:',
        this.potenciaMaxAsignadakW
      );

      this.onPotenciaInputChange();
      console.debug('Después de llamar a onPotenciaInputChange()');

      this.sharedService.setPotenciaMaxAsignadaW(
        this.potenciaMaxAsignadakW * 1000
      );
      console.debug(
        'Potencia máxima asignada (W) enviada al SharedService:',
        this.potenciaMaxAsignadakW * 1000
      );

      if (!this.isDialogOpen) {
        this.checkPotenciaExcedida();
      }
      console.debug('Después de llamar a checkPotenciaExcedida()');

      this.cdr.detectChanges();
      console.debug('Detección de cambios forzada');
    } else {
      console.debug('El valor no es un número válido');
    }

    console.debug('Finalizando onSliderChange');
  }

  formatLabel(value: number): string {
    return new Intl.NumberFormat('es-ES').format(value * 1000);
  }

  private updatePotenciaMaxAsignada(): void {
    console.debug('Iniciando updatePotenciaMaxAsignada');
    console.debug('Tarifa contratada:', this.tarifaContratada);

    const tarifaSeleccionada = this.tarifas.find(
      (t) => t.value === this.tarifaContratada
    );
    console.debug('Tarifa seleccionada:', tarifaSeleccionada);

    if (tarifaSeleccionada) {
      console.debug(
        'Potencia máxima asignada (kW) antes:',
        this.potenciaMaxAsignadakW
      );
      this.potenciaMaxAsignadakW = tarifaSeleccionada.potenciaMaxAsignadakW;
      console.debug(
        'Potencia máxima asignada (kW) después:',
        this.potenciaMaxAsignadakW
      );

      const potenciaMaxAsignadaW = this.potenciaMaxAsignadakW * 1000;
      console.debug('Potencia máxima asignada (W):', potenciaMaxAsignadaW);
      this.sharedService.setPotenciaMaxAsignadaW(potenciaMaxAsignadaW);
      console.debug('Potencia máxima asignada actualizada en SharedService');
    } else {
      console.debug('No se encontró una tarifa seleccionada');
    }

    console.debug('Finalizando updatePotenciaMaxAsignada');
  }

  private checkPotenciaExcedida(): void {
    const potenciaMaxAsignadaW =
      this.sharedService.getPotenciaMaxAsignadaValue();

    // Si la tarifa no ha sido seleccionada o la potencia máxima es inválida, no realizar la validación
    if (!potenciaMaxAsignadaW || potenciaMaxAsignadaW <= 0) {
      console.debug(
        'No se ha seleccionado una tarifa o el valor de potencia máxima es inválido.'
      );
      return;
    }

    const potenciaInstaladaW =
      this.sharedService.getPanelsSelected() *
      this.sharedService.getPanelCapacityW();

    if (potenciaInstaladaW > potenciaMaxAsignadaW) {
      console.debug(
        'Potencia excedida:',
        potenciaInstaladaW,
        'vs',
        potenciaMaxAsignadaW
      );
      this.openDialog(potenciaInstaladaW, potenciaMaxAsignadaW);
      this.mapService.reDrawPanels(potenciaMaxAsignadaW);
    } else {
      console.debug(
        'Potencia dentro del límite permitido:',
        potenciaInstaladaW,
        'de',
        potenciaMaxAsignadaW
      );
    }
  }
}
