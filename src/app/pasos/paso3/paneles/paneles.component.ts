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
    this.potenciaPanelesControl.setValue(this.panelCapacityW.toString() ?? 400);

    this.maxPanelsPerAreaSubscription =
      this.sharedService.maxPanelsPerSuperface$.subscribe({
        next: (value) => {
          this.maxPanelsArea$ = value;
          this.panelesCantidad = Math.max(
            4,
            Math.min(this.panelesCantidad, this.maxPanelsArea$)
          );
          this.sharedService.setPanelsCountSelected(this.panelesCantidad);
        },
      });

    this.sharedService.setPanelsCountSelected(this.panelesCantidad);

    // Suscríbete al observable del plazo de recuperación de la inversión
    this.plazoInversionSubscription =
      this.sharedService.plazoInversion$.subscribe({
        next: (plazo) => {
          this.plazoRecuperoInversion = plazo;
        },
      });

    this.disableOptionsExceedingMaxCapacity();

    this.potenciaPanelesControl.valueChanges.subscribe((value: any) => {
      const panelCapacity = parseInt(value, 10);
      this.sharedService.setPanelCapacityW(panelCapacity);
      this.panelCapacityW = panelCapacity;
      return;
    });
  }

  ngAfterViewInit(): void {
    this.sharedService.setPanelsCountSelected(this.panelesCantidad);
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
    const maxPotenciaInstalacion =
      this.sharedService.getPotenciaMaxAsignadaValue();
    const panelCapacity = this.panelCapacityW;

    const maxAllowedPanels = Math.floor(maxPotenciaInstalacion / panelCapacity);
    // Limita el valor máximo del slider al número máximo permitido de paneles
    this.slider.max = Math.min(maxAllowedPanels, this.maxPanelsArea$);

    if (this.panelesCantidad > this.slider.max) {
      this.panelesCantidad = this.slider.max;
    }

    this.panelesCantidad = Math.max(
      4,
      Math.min(this.panelesCantidad, this.maxPanelsArea$)
    );

    this.mapService.reDrawPanels(this.panelesCantidad);
    this.sharedService.setPanelsCountSelected(this.panelesCantidad);
    this.disableOptionsExceedingMaxCapacity();
  }

  formatLabel(value: number): string {
    return value >= 1000 ? Math.round(value / 1000) + 'k' : `${value}`;
  }

  disableOptionsExceedingMaxCapacity() {
    const maxPotenciaInstalacion =
      this.sharedService.getPotenciaMaxAsignadaValue();
    const panelsCountSelected = this.sharedService.getPanelsSelected();
    const selectElement = document.querySelector('select#power-select');

    if (selectElement) {
      selectElement.querySelectorAll('option').forEach((option) => {
        const panelCapacity = parseInt(option.value, 10);
        const newPotenciaInstalacion = panelCapacity * panelsCountSelected;

        if (newPotenciaInstalacion > maxPotenciaInstalacion) {
          option.setAttribute('disabled', 'true');
        } else {
          option.removeAttribute('disabled');
        }
      });
    }
  }
}
