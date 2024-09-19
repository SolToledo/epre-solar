import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-energia',
  templateUrl: './energia.component.html',
  styleUrls: ['./energia.component.css'],
})
export class EnergiaComponent implements OnInit, OnDestroy {
  @Input() yearlyEnergyAckWhInitial!: number;  // Valor inicial recibido como input
  private yearlyEnergyAckWh!: number;          // Valor interno calculado
  private potenciaOriginalW!: number;          // Potencia original en watts
  private destroy$ = new Subject<void>();      // Para limpiar las suscripciones

  constructor(private sharedService: SharedService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('ngOnInit: Inicializando componente EnergiaComponent');
    console.log('Valor inicial de yearlyEnergyAckWhInitial:', this.yearlyEnergyAckWhInitial);

    // Asignamos el valor inicial de energía anual
    this.yearlyEnergyAckWh = this.yearlyEnergyAckWhInitial;
    console.log('yearlyEnergyAckWh asignado con el valor inicial:', this.yearlyEnergyAckWh);
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit: La vista ha sido inicializada');

    // Nos suscribimos al observable de potencia de instalación
    this.sharedService.potenciaInstalacionW$
      .pipe(takeUntil(this.destroy$))
      .subscribe(potencia => {
        console.log('Suscripción potenciaInstalacionW$: Recibido nueva potencia:', potencia);
        this.updateYearlyEnergy(potencia);  // Llamamos a la función de actualización de energía
      });

    // Forzamos la detección de cambios para evitar posibles errores en la visualización
    this.cdr.detectChanges();
    
    // Obtenemos la potencia original de la instalación desde el servicio
    this.potenciaOriginalW = this.sharedService.getPotenciaInstalacionW();
    console.log('potenciaOriginalW obtenida desde sharedService:', this.potenciaOriginalW);
  }

  ngOnDestroy(): void {
    console.log('ngOnDestroy: Componente EnergiaComponent destruido, limpiando suscripciones');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Función para actualizar la energía anual basada en la nueva potencia
  private updateYearlyEnergy(nuevaPotenciaW: number): void {
    console.log('updateYearlyEnergy: Actualizando energía con nueva potencia:', nuevaPotenciaW);

    // Verificamos que todos los valores sean mayores que 0
    if (nuevaPotenciaW > 0 && this.yearlyEnergyAckWhInitial > 0 && this.potenciaOriginalW > 0) {
      const ratio = nuevaPotenciaW / this.potenciaOriginalW;
      console.log('Ratio calculado entre nueva potencia y potencia original:', ratio);

      // Actualizamos la energía anual con el ratio calculado
      this.yearlyEnergyAckWh = this.yearlyEnergyAckWhInitial * ratio;
      console.log('yearlyEnergyAckWh actualizado:', this.yearlyEnergyAckWh);

      // Actualizamos el servicio con el nuevo valor de energía anual
      this.sharedService.setYearlyEnergyAckWh(this.yearlyEnergyAckWh);
      console.log('Nuevo valor de yearlyEnergyAckWh enviado al servicio.');
    } else {
      console.error(
        'Error: La potencia de instalación o la energía anual inicial no pueden ser 0.',
        'nuevaPotenciaW:', nuevaPotenciaW,
        'yearlyEnergyAckWhInitial:', this.yearlyEnergyAckWhInitial,
        'potenciaOriginalW:', this.potenciaOriginalW
      );
    }
  }

  // Getter para obtener el valor actual de energía anual
  get currentYearlyEnergy(): number {
    console.log('Obteniendo currentYearlyEnergy:', this.yearlyEnergyAckWh);
    return this.yearlyEnergyAckWh;
  }
}
