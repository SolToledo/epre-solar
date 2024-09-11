import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-costo',
  templateUrl: './costo.component.html',
  styleUrls: ['./costo.component.css'],
})
export class CostoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  costoInstalacion: number = 0;
  costoInstalacionInitial: number = 0;
  panelsCountInitial: number = 0;
  panelsCountSelected: number = 0;
  panelCapacityW: number = 0;
  panelCapacityWInitial: number = 0;
  potenciaInstalacionInitialW!: number;
  potenciaInstalacionAcutalW!: number;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Inicializamos valores iniciales

  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.costoInstalacionInitial = this.sharedService.getCostoInstalacion();
    this.potenciaInstalacionInitialW =
      this.sharedService.getPotenciaInstalacionW();

    // Suscripción al costo de instalación
    this.sharedService.costoInstalacion$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newCosto) => {
          this.costoInstalacion = newCosto;
        },
      });

    // Suscripción a la potencia de instalación
    this.sharedService.potenciaInstalacionW$
      .pipe(takeUntil(this.destroy$)) // Desuscribimos cuando el componente se destruye
      .subscribe({
        next: (newPotenciaInstalacion) => {
          this.potenciaInstalacionAcutalW = newPotenciaInstalacion;
          this.updateCostoInstalacion(); // Actualizamos el costo cuando cambia la potencia
          this.cdr.detectChanges(); // Forzamos la detección de cambios
        },
      });
  }

  ngOnDestroy(): void {
    // Desuscribirnos de todas las suscripciones al destruir el componente
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Método para actualizar el costo de instalación basado en la potencia
  private updateCostoInstalacion() {
    const potenciaInstalacionInitialW = this.potenciaInstalacionInitialW;
    const potenciaInstalacionActualW =
      this.sharedService.getPotenciaInstalacionW();
    const costoInstalacionInitial = this.costoInstalacionInitial;

    // Factor para calcular el costo en función del cambio en potencia
    const factorCambio =
      potenciaInstalacionActualW / potenciaInstalacionInitialW;

    const newCosto = costoInstalacionInitial * factorCambio;

    // Si el nuevo costo es diferente al actual, actualizamos
    if (newCosto !== this.costoInstalacion) {
      this.costoInstalacion = Math.round(newCosto); // Redondeamos si es necesario
      this.sharedService.setCostoInstalacion(this.costoInstalacion);
    }
  }
}
