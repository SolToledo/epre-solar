import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSlider } from '@angular/material/slider';
import { Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DimensionPanel } from 'src/app/interfaces/dimension-panel';
import { MapService } from 'src/app/services/map.service';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-paneles',
  templateUrl: './paneles.component.html',
  styleUrls: ['./paneles.component.css'],
})
export class PanelesComponent implements OnInit, OnDestroy {
  @Input() dimensionPanel!: DimensionPanel;
  @Input() panelCapacityW: number = 0; // Capacidad de paneles en Watts

  @ViewChild(MatSlider) slider!: MatSlider; // Referencia al slider

  // Control para el valor de la potencia de los paneles
  potenciaPanelesControl = new FormControl('');

  maxPanelsArea$: number = 0; // Máximo número de paneles basado en el área
  panelesSelectCount: number = 4; // Número de paneles seleccionados
  plazoRecuperoInversion!: number; // Plazo de recuperación de inversión
  private maxPanelsPerAreaSubscription!: Subscription;
  private plazoInversionSubscription!: Subscription;

  // Observable para gestionar la destrucción del componente
  private destroy$ = new Subject<void>();
  maxPanelsPerPotentiaMax!: number;

  constructor(
    private mapService: MapService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('PanelesComponent: Constructor iniciado');
  }

  ngOnInit(): void {
    console.log('PanelesComponent: ngOnInit iniciado');
    this.panelCapacityW = this.sharedService.getPanelCapacityW();
    this.panelesSelectCount = this.sharedService.getPanelsSelected();
    // Establecer valor inicial para la potencia de los paneles
    this.potenciaPanelesControl.setValue(
      this.panelCapacityW.toString() || '400'
    );
    console.log(
      'PanelesComponent: Valor inicial de potenciaPanelesControl:',
      this.potenciaPanelesControl.value
    );

    // Suscribirse al cambio de la capacidad de los paneles
    this.potenciaPanelesControl.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((value: any) => {
        console.log(
          'PanelesComponent: Cambio en potenciaPanelesControl:',
          value
        );
        const panelCapacity = parseInt(value, 10);
        this.sharedService.setPanelCapacityW(panelCapacity);
        this.sharedService.setFactorPotencia(panelCapacity/this.sharedService.getPanelCapacityW());
        this.panelCapacityW = panelCapacity;
        console.log(
          'PanelesComponent: Nueva capacidad de panel:',
          this.panelCapacityW
        );

        // Actualizar el máximo permitido y redibujar paneles
        // this.updateMaxPanels();
        // this.mapService.reDrawPanels(this.panelesSelectCount);
      });

    // Subscripción para obtener el máximo número de paneles permitido por el área
    this.maxPanelsPerAreaSubscription =
      this.sharedService.maxPanelsPerSuperface$.subscribe((value) => {
        console.log(
          'PanelesComponent: Nuevo valor de maxPanelsPerSuperface:',
          value
        );
        this.maxPanelsArea$ = value;
        this.updateMaxPanels();
      });

    // Subscripción al plazo de recuperación de la inversión
    this.plazoInversionSubscription = this.sharedService.plazoInversion$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((plazo) => {
        console.log(
          'PanelesComponent: Nuevo plazo de recuperación de inversión:',
          plazo
        );
        this.plazoRecuperoInversion = plazo;
      });
  }

  ngAfterViewInit(): void {
    console.log('PanelesComponent: ngAfterViewInit iniciado');
    // Redibujar paneles al inicializar la vista
    this.updateMaxPanels();
    this.panelesSelectCount = this.slider.max;
  }

  ngOnDestroy(): void {
    console.log('PanelesComponent: ngOnDestroy iniciado');
    // Cancelar las suscripciones al destruir el componente
    this.maxPanelsPerAreaSubscription?.unsubscribe();
    this.plazoInversionSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSliderChange() {
    console.log('PanelesComponent: onSliderChange iniciado');
    // Actualizar el número de paneles seleccionados y redibujar
    this.updateMaxPanels();
    this.mapService.reDrawPanels(this.panelesSelectCount);
  }

  updateMaxPanels() {
    console.log('PanelesComponent: updateMaxPanels iniciado');
  
    // Obtener el valor máximo de potencia permitida y calcular el número máximo de paneles por potencia
    const maxPotenciaInstalacion = this.sharedService.getPotenciaMaxAsignadaValue();
    const maxPanelsPerPotentiaMax = Math.floor(maxPotenciaInstalacion / this.sharedService.getPanelCapacityW());
  
    // Calcular el número máximo de paneles que soporta la superficie seleccionada
    const maxPanelsArea = this.sharedService.getPanelsSelected();
  
    // Determinar el máximo permitido entre el área y la potencia
    const maxAllowedPanels = maxPanelsPerPotentiaMax;
    // const maxAllowedPanels = Math.max(maxPanelsPerPotentiaMax, maxPanelsArea);
  
    console.log('PanelesComponent: maxAllowedPanels (menor entre área y potencia):', maxAllowedPanels);
  
    // Actualizar el máximo del slider solo si es necesario
    if (this.slider && this.slider.max !== maxAllowedPanels) {
      this.slider.max = maxAllowedPanels;
      console.log('PanelesComponent: Slider max actualizado:', this.slider.max);
    }
  
    // Solo actualizar el número de paneles seleccionados si ha cambiado el valor máximo permitido
    const newPanelCount = Math.min(maxAllowedPanels, this.panelesSelectCount || maxAllowedPanels);
    if (this.panelesSelectCount !== newPanelCount) {
      this.panelesSelectCount = newPanelCount;
      console.log('PanelesComponent: panelesSelectCount seteado al máximo permitido:', this.panelesSelectCount);
      
      // Actualizar el número seleccionado de paneles en el servicio compartido
      this.sharedService.setPanelsCountSelected(this.panelesSelectCount);
      console.log('PanelesComponent: panelesSelectCount actualizado en SharedService:', this.panelesSelectCount);
      
      // Forzar la detección de cambios si se necesita
      
    }
    this.cdr.detectChanges();
  }
  
  

  formatLabel(value: number): string {
    // Formatear etiquetas del slider
    const formattedValue =
      value >= 1000 ? Math.round(value / 1000) + 'k' : `${value}`;
    console.log('PanelesComponent: Etiqueta formateada:', formattedValue);
    return formattedValue;
  }
}
