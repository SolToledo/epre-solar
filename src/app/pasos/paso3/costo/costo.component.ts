import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-costo',
  templateUrl: './costo.component.html',
  styleUrls: ['./costo.component.css']
})
export class CostoComponent implements OnInit, OnDestroy{
  private destroy$ = new Subject<void>();
  
  @Input()
  costoInstalacion: number = 0;
  costoInstalacionInitial: number = 0;
  panelsCountInitial: number = 0;
  panelsCountSelected: number = 0;
  panelCapacityW: number = 0;
  panelCapacityWInitial: number = 0;

  constructor(private sharedService:SharedService, private cdr:ChangeDetectorRef){}

  ngOnInit(): void {
    this.sharedService.costoInstalacion$.pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe({
      next: (costo) => {
        if (this.costoInstalacionInitial === 0) {
          this.costoInstalacionInitial = costo;
          this.costoInstalacion = costo;
        } else {
          this.costoInstalacion = costo;
        }
        this.updateCostoInstalacion();
        this.cdr.detectChanges();
      },
    });

  this.sharedService.panelsCountSelected$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe({
      next: (newPanelsCountSelected) => {
        if (this.panelsCountInitial === 0) {
          this.panelsCountInitial = newPanelsCountSelected;
        }
        this.panelsCountSelected = newPanelsCountSelected;
        this.updateCostoInstalacion();
        this.cdr.detectChanges();
      },
    });

  this.sharedService.panelCapacityW$
    .pipe(takeUntil(this.destroy$), distinctUntilChanged())
    .subscribe({
      next: (newPanelCapacity) => {
        if (this.panelCapacityWInitial === 0) {
          this.panelCapacityWInitial = newPanelCapacity;
        }
        this.panelCapacityW = newPanelCapacity;
        this.updateCostoInstalacion();
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateCostoInstalacion() {
    if (this.panelsCountSelected > 0 && this.panelCapacityW > 0 && this.panelsCountInitial > 0 && this.panelCapacityWInitial > 0) {
      const newAhorroValue =
        (this.panelsCountSelected * this.panelCapacityW * this.costoInstalacionInitial) /
        (this.panelsCountInitial * this.panelCapacityWInitial);
  
      // Convertimos el valor calculado a un número entero
      const roundedCostoInstalacionValue = parseInt(newAhorroValue.toFixed(0));
  
      // Solo actualizamos si el nuevo valor es diferente del actual
      if (roundedCostoInstalacionValue !== this.sharedService.getCostoInstalacion()) {
        this.sharedService.setCostoInstalacion(roundedCostoInstalacionValue);
      }
    }
  }
}
