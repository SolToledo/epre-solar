import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TarifaComponent } from './tarifa/tarifa.component';
import { MapService } from 'src/app/services/map.service';
import { InstruccionesComponent } from 'src/app/instrucciones/instrucciones.component';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSlideToggle,
  MatSlideToggleChange,
} from '@angular/material/slide-toggle';
import { ConsumoComponent } from './consumo/consumo.component';
import { driver } from 'driver.js';
import { SharedService } from 'src/app/services/shared.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-paso2',
  templateUrl: './paso2.component.html',
  styleUrls: ['./paso2.component.css'],
})
export class Paso2Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentStep: number = 2;
  allFieldsFilled: boolean = false;
  tarifaContratada: string = '';
  isCategorySelected: boolean = false;
  isFieldsDisabled: boolean = true;
  isEditable: boolean = false;
  driverObj: any;
  tutorialShown: boolean = false;
  showInstructionsModal: boolean = false;

  @ViewChild('botonSiguiente') botonSiguiente!: ElementRef;
  @ViewChild(TarifaComponent) tarifaComponent!: TarifaComponent;
  @ViewChild('manualToggle') manualToggle!: MatSlideToggle;
  @ViewChild(ConsumoComponent) consumoComponent!: ConsumoComponent;
  @ViewChild('consumoContainer') consumoContainer!: ElementRef;
  @ViewChild('categoriaSelect') categoriaSelect!: ElementRef;

  driverObjInit: any;
  driverObjConsumo: any;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private mapService: MapService,
    public dialog: MatDialog,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.mapService.hideDrawingControl();
    this.sharedService.tutorialShown$
      .pipe(takeUntil(this.destroy$))
      .subscribe((shown) => {
        this.tutorialShown = shown;
      });
  }

  ngAfterViewInit(): void {
    const urlFromPaso1 =
      this.router.url === '/pasos/2' &&
      this.router
        .getCurrentNavigation()
        ?.previousNavigation?.finalUrl?.toString() === '/pasos/1';
    const urlFromPaso3 =
      this.router.url === '/pasos/2' &&
      this.router
        .getCurrentNavigation()
        ?.previousNavigation?.finalUrl?.toString() === '/pasos/3';
    if (urlFromPaso1) {
      this.consumoComponent?.resetMesesConsumo();
    } else if (urlFromPaso3) {
      this.allFieldsFilled = true;
      this.isCategorySelected = true;
    }

    this.driverObjInit = driver({
      showProgress: false,
      steps: [
        {
          element: '#titulo',
          popover: {
            title: 'Consumo',
            description: 'Aquí puede configurar su consumo energético.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: this.categoriaSelect.nativeElement,
          popover: {
            title: 'Aquí seleccione su tarifa contratada',
            description:
              'Al seleccionar su tarifa, se establecerán consumos mensuales predeterminados.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: this.consumoContainer.nativeElement,
          popover: {
            title: 'Cuadro de consumos mensuales',
            description:
              'Estos valores se encuentran predefinidos. Podrá modificarlos habilitando la carga manual.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: this.manualToggle._elementRef.nativeElement,
          popover: {
            title: 'Carga Manual',
            description:
              'Puede activar esta opción para ingresar manualmente su consumo mensual.',
            side: 'left',
            align: 'start',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
        {
          element: this.botonSiguiente.nativeElement,
          popover: {
            title: 'Siguiente Paso',
            description:
              'Cuando haya completado todos los campos, presione este botón para continuar.',
            side: 'left',
            align: 'start',
            prevBtnText: 'Anterior',
            doneBtnText: 'Terminar',
          },
        },
      ],
    });

    // Escuchar cambios en el toggle de carga manual
    this.manualToggle.change
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.onManualToggleChange(event.checked);
      });

    if (!this.tutorialShown) {
      setTimeout(() => {
        this.driverObjInit.drive();
        this.sharedService.setTutorialShown(true);
      }, 50);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onManualToggleChange(isManual: boolean): void {
    this.isEditable = isManual;
    if (this.isEditable) {
      this.consumoComponent.resetMesesConsumo();
    }
    this.isFieldsDisabled = !isManual;
    if (!isManual) {
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

  showInstructions() {
    this.showInstructionsModal = true;
  }

  handleInstructionsClosed() {
    this.showInstructionsModal = false;
  }

  showTooltip() {
    setTimeout(() => {
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
