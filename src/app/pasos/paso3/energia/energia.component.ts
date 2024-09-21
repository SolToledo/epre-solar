import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { RecalculateService } from 'src/app/services/recalculate.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-energia',
  templateUrl: './energia.component.html',
  styleUrls: ['./energia.component.css'],
})
export class EnergiaComponent implements OnInit, OnDestroy {
  @Input() yearlyEnergyAckWhInitial!: number; // Valor inicial recibido como input
  private yearlyEnergyAckWh!: number; // Valor interno calculado
  private potenciaOriginalW!: number; // Potencia original en watts
  private destroy$ = new Subject<void>(); // Para limpiar las suscripciones
  @Output() recalculoIniciado: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() recalculoTerminado: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef,
    private recalculateService: RecalculateService
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit: Inicializando componente EnergiaComponent');
    console.log(
      'Valor inicial de yearlyEnergyAckWhInitial:',
      this.yearlyEnergyAckWhInitial
    );

    // Asignamos el valor inicial de energía anual
    this.sharedService.yearlyEnergyAckWh$
      .pipe(takeUntil(this.destroy$))
      .subscribe((yearlyEnergyAckWh) => {
        if (!this.yearlyEnergyAckWhInitial) {
          this.yearlyEnergyAckWhInitial = yearlyEnergyAckWh;
        }
        this.yearlyEnergyAckWh = yearlyEnergyAckWh;
      });

    // Obtenemos la potencia original de la instalación desde el servicio
    this.potenciaOriginalW = this.sharedService.getPotenciaInstalacionW();
    console.log(
      'potenciaOriginalW obtenida desde sharedService:',
      this.potenciaOriginalW
    );
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit: La vista ha sido inicializada');

    // Nos suscribimos al observable de potencia de instalación
    this.sharedService.potenciaInstalacionW$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((potencia) => {
        console.log(
          'Suscripción potenciaInstalacionW$: Recibido nueva potencia:',
          potencia
        );
        this.updateYearlyEnergy(); // Llamamos a la función de actualización de energía
      });

    // Forzamos la detección de cambios para evitar posibles errores en la visualización
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    console.log(
      'ngOnDestroy: Componente EnergiaComponent destruido, limpiando suscripciones'
    );
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Función para actualizar la energía anual basada en la nueva potencia
  private async updateYearlyEnergy(): Promise<void> {
    
    this.recalculoIniciado.emit(true);
    const panelCapacity = this.sharedService.getPanelCapacityW();
    let panels400WCount = this.sharedService.getPanelsSelected();
    if (panelCapacity !== 400) {
      panels400WCount = Math.round(
        this.sharedService.getPotenciaInstalacionW() / 400
      );
    }
    
    await this.recalculateService
      .recalculateyearlyEnergyACkWh(panels400WCount)
      .then((recalculoOk) => {
        this.cdr.detectChanges();
        console.log('recalculoOk:', recalculoOk);
      })
      .catch((recalculoFail) => {
        console.log('recalculoFail:', recalculoFail);
      }).finally(() => {
        this.recalculoTerminado.emit(false);
      });
  }

  // Getter para obtener el valor actual de energía anual
  get currentYearlyEnergy(): number {
    // console.log('Obteniendo currentYearlyEnergy:', this.yearlyEnergyAckWh);
    return this.yearlyEnergyAckWh;
  }
}
