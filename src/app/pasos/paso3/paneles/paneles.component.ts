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
import { Subscription } from 'rxjs';
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
  @Input() panelCapacityW: number = 0;
  @ViewChild(MatSlider) slider!: MatSlider;
  private maxPanelsPerAreaSubscription!: Subscription;
  maxPanelsArea$: number = 0;
  panelesCantidad: number = 4;
  private plazoInversionSubscription!: Subscription;
  plazoRecuperoInversion!: number;
  plazoRecuperoInversionValorInicial: number;
  potenciaPanelesControl = new FormControl('');

  constructor(
    private mapService: MapService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
    this.plazoRecuperoInversionValorInicial =
      this.sharedService.getPlazoInversionValue();
    this.panelesCantidad = this.sharedService.getPanelsSelected();
  }

  ngOnInit(): void {
    console.log('Iniciando PanelesComponent');
    this.potenciaPanelesControl.setValue(this.panelCapacityW.toString() ?? '400');

    // Subscripción para obtener la cantidad máxima de paneles permitida por el área
    this.maxPanelsPerAreaSubscription =
      this.sharedService.maxPanelsPerSuperface$.subscribe({
        next: (value) => {
          console.log('Máximo de paneles por área actualizado:', value);
          this.maxPanelsArea$ = value;

          // Verificar si la potencia máxima permite colocar todos los paneles
          this.updateMaxPanels();
        },
      });

    // Suscribirse al cambio de potencia de los paneles
    this.potenciaPanelesControl.valueChanges.subscribe((value: any) => {
      console.log('Potencia de paneles cambiada a:', value);
      const panelCapacity = parseInt(value, 10);
      this.sharedService.setPanelCapacityW(panelCapacity);
      this.panelCapacityW = panelCapacity;

      // Verificar si la nueva capacidad afecta el número de paneles y el máximo permitido
      this.updateMaxPanels();
      this.mapService.reDrawPanels(this.panelesCantidad);
    });

    // Subscripción al observable del plazo de recuperación de la inversión
    this.plazoInversionSubscription =
      this.sharedService.plazoInversion$.subscribe({
        next: (plazo) => {
          this.plazoRecuperoInversion = plazo;
        },
      });
  }

  ngAfterViewInit(): void {
    this.sharedService.setPanelsCountSelected(this.panelesCantidad);
    this.mapService.reDrawPanels(this.panelesCantidad);
  }

  ngOnDestroy(): void {
    if (this.maxPanelsPerAreaSubscription) {
      this.maxPanelsPerAreaSubscription.unsubscribe();
    }
    if (this.plazoInversionSubscription) {
      this.plazoInversionSubscription.unsubscribe();
    }
  }

  onSliderChange() {
    console.log('Slider cambiado. Nuevo valor:', this.panelesCantidad);
    this.updateMaxPanels();
    this.mapService.reDrawPanels(this.panelesCantidad);
  }

  updateMaxPanels() {
    console.log('Actualizando máximo de paneles');
    const maxPotenciaInstalacion =
      this.sharedService.getPotenciaMaxAsignadaValue();
    const maxAllowedPanels = Math.ceil(
      maxPotenciaInstalacion / this.panelCapacityW
    );
    console.log('Máximo de paneles permitidos por potencia:', maxAllowedPanels);
  console.log('Máximo de paneles permitidos por área:', this.maxPanelsArea$);

    // Establecer el número máximo de paneles considerando tanto la superficie como la potencia
    const maxPanelesPermitidos = Math.min(
      maxAllowedPanels,
      this.maxPanelsArea$
    );
    console.log('Máximo final de paneles permitidos:', maxPanelesPermitidos);
    
    // Ajustar el slider para que el máximo sea la cantidad de paneles permitidos
    if (this.slider) {
      this.slider.max = maxPanelesPermitidos;
    }

    // Asegurar que la cantidad de paneles no exceda el máximo permitido
    this.panelesCantidad = Math.max(
      4,
      Math.min(this.panelesCantidad, maxPanelesPermitidos)
    );
    console.log('Cantidad de paneles ajustada:', this.panelesCantidad);
    // Actualizar el valor seleccionado en el servicio compartido
    this.sharedService.setPanelsCountSelected(this.panelesCantidad);
  }

  formatLabel(value: number): string {
    return value >= 1000 ? Math.ceil(value / 1000) + 'k' : `${value}`;
  }
}
