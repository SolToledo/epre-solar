import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TarifaComponent } from './tarifa/tarifa.component';
import { MapService } from 'src/app/services/map.service';
import { InstruccionesComponent } from 'src/app/instrucciones/instrucciones.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ConsumoComponent } from './consumo/consumo.component';

@Component({
  selector: 'app-paso2',
  templateUrl: './paso2.component.html',
  styleUrls: ['./paso2.component.css'],
})
export class Paso2Component implements OnInit {
  currentStep: number = 2;
  allFieldsFilled: boolean = false;
  tarifaContratada: string = '';
  isCategorySelected: boolean = false;
  private tooltipTimeout: any;
  isFieldsDisabled: boolean = true;
  isEditable: boolean = false;
  
  @ViewChild('botonSiguiente') botonSiguiente!: ElementRef;
  @ViewChild(TarifaComponent) tarifaComponent!: TarifaComponent;
  @ViewChild('manualToggle') manualToggle!: MatSlideToggle;
  @ViewChild(ConsumoComponent) consumoComponent!: ConsumoComponent;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private mapService: MapService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.mapService.hideDrawingControl();
  }

  ngAfterViewInit(): void {
    // Escuchar cambios en el toggle de carga manual
    this.manualToggle.change.subscribe((event) => {
      this.onManualToggleChange(event.checked);
    });
  }

  onManualToggleChange(isManual: boolean): void {
    this.isEditable = isManual;
    if(this.isEditable){
      this.consumoComponent.resetMesesConsumo();
      
    }
    this.isFieldsDisabled = !isManual;
    if(!isManual) {
      this.tarifaComponent.onTarifaChange();
    }
  }

  goBack() {
    this.router.navigate(['pasos/1']);
  }

  goToPaso3() {
    if (this.allFieldsFilled && this.isCategorySelected) {
      this.router.navigate(['pasos/3']);
    }
  }

  onAllFieldsCompleted(event: boolean): void {
    this.allFieldsFilled = event;
  }
  onCategorySelected(event: boolean): void {
    this.isCategorySelected = event;
    this.isFieldsDisabled = !event;
  }

  showTooltip() {
    this.tooltipTimeout = setTimeout(() => {
      if (!this.allFieldsFilled || !this.isCategorySelected) {
        this.snackBar.open(
          'Debe ingresar todos los meses para poder continuar.',
          '',
          {
            duration: 3000,
            panelClass: ['custom-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top',
          }
        );
      }
    }, 700);
  }

  hideTooltip() {
    this.snackBar.dismiss();
  }

  openHelpModal(): void {
    this.dialog.open(InstruccionesComponent, {
      width: '500px',
    });
  }

}
