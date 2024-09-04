import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import html2canvas from 'html2canvas';
import { GmailService } from 'src/app/services/gmail.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolarApiService } from 'src/app/services/solar-api.service';
import { SharedService } from 'src/app/services/shared.service';
import { ResultadosFrontDTO } from '../../interfaces/resultados-front-dto';
import { DimensionPanel } from 'src/app/interfaces/dimension-panel';
import { MapService } from 'src/app/services/map.service';
import jsPDF from 'jspdf';
import { ConsumoTarifaService } from 'src/app/services/consumo-tarifa.service';
import { ConsumoService } from 'src/app/services/consumo.service';
import { NearbyLocationService } from 'src/app/services/nearby-location.service';
import { Paso2Component } from '../paso2/paso2.component';
import { PdfService } from 'src/app/services/pdf.service';
@Component({
  selector: 'app-paso3',
  templateUrl: './paso3.component.html',
  styleUrls: ['./paso3.component.css'],
})
export class Paso3Component implements OnInit {
  isModalOpen = false;
  email: string = '';

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  items: any[] = [];
  currentStep: number = 3;
  mostrarModal: boolean = false;
  private resultadosFront!: ResultadosFrontDTO;
  panelesCantidad: number = 0;
  dimensionPanel: DimensionPanel = { height: 0, width: 0 };
  panelCapacityW: number = 0;
  carbonOffsetFactorTnPerMWh: number = 0;
  map: any;
  maxPanelsCount!: number;
  private polygons!: any[];
  isLoading!: boolean;
  instalacionPotencia: number = 0;
  yearlyEnergyAcKwh: number = 0;
  yearlyEnergyInitial!: number;
  proporcionAutoconsumo: number = 0;
  consumoTotalAnual: number = 0;
  paso2!: Paso2Component;

  constructor(
    private router: Router,
    private readonly gmailService: GmailService,
    private snackBar: MatSnackBar,
    private solarService: SolarApiService,
    private sharedService: SharedService,
    private mapService: MapService,
    private consumoTarifaService: ConsumoTarifaService,
    private consumoService: ConsumoService,
    private nearbyService: NearbyLocationService,
    private pdfService: PdfService
  ) {
    this.sharedService.isLoading$.subscribe({
      next: (value) => (this.isLoading = value),
    });
  }
  ngOnInit(): void {
    this.sharedService.setIsLoading(true);
    setTimeout(() => {
      this.mapService.recenterMapToVisibleArea();
    }, 300);

    if (!this.sharedService.getNearbyLocation()) {
      this.solarService
        .calculate()
        .then((resultados) => (this.resultadosFront = resultados))
        .then(() => this.initialLoadFields())
        .then(() => this.sharedService.setIsLoading(false))
        .catch((error) => {
          this.snackBar.open(
            'Hubo un problema al calcular los ahorros solares. Inténtelo más tarde.',
            'Cerrar',
            {
              duration: 5000,
              panelClass: ['error-snackbar'],
              horizontalPosition: 'center',
              verticalPosition: 'top',
            }
          );
          this.router.navigate(['/pasos/1']);
        });
    } else {
      this.snackBar.open(
        'Resultados calculados en base a uno de los 33 puntos.',
        '',
        {
          duration: 5000,
          panelClass: ['custom-snackbar'],
        }
      );

      this.nearbyService
        .calculate(this.sharedService.getNearbyLocation())
        .then((resultado) => {
          this.resultadosFront = resultado;
        })
        .then(() => this.initialLoadFields())
        .catch((error) => console.log('error ', error));
      this.sharedService.setIsLoading(false);
    }
  }

  private initialLoadFields(): void {
    this.yearlyEnergyAcKwh = parseFloat(
      this.resultadosFront.solarData.yearlyEnergyAcKwh.toFixed(0)
    );
    this.yearlyEnergyInitial = this.yearlyEnergyAcKwh;
    this.sharedService.setYearlyEnergyAcKwh(this.yearlyEnergyAcKwh);
    this.sharedService.setPlazoInversion(
      this.resultadosFront.resultadosFinancieros.indicadoresFinancieros
        .payBackSimpleYears * 12
    );

    this.panelesCantidad = this.resultadosFront.solarData.panels.panelsCountApi;
    this.dimensionPanel = this.resultadosFront.solarData.panels.panelSize;
    this.panelCapacityW = this.resultadosFront.solarData.panels.panelCapacityW;

    
    
    this.sharedService.setPanelCapacityW(this.panelCapacityW);
    this.sharedService.setPanelsCountSelected(this.panelesCantidad);
    this.carbonOffsetFactorTnPerMWh = parseFloat(
      (
        this.resultadosFront.solarData.carbonOffsetFactorKgPerMWh / 1000
      ).toFixed(3)
    );

    this.proporcionAutoconsumo = 85; // todo: traer dato de los parametros

    

    this.consumoService.totalConsumo$.subscribe({
      next: (value) => (this.consumoTotalAnual = value),
    });
  }

  downloadPDF(): void {
    html2canvas(document.querySelector('#info-container')!, {}).then(
      (canvas) => {
        const resultadosScreenshot = canvas.toDataURL('image/png');
        html2canvas(document.querySelector('#graficos')!, {}).then(
          (canvas2) => {
            const graficos = canvas2.toDataURL('image/png');
            // Recolectar los resultados calculados
            const resultadosCalculados = {
              panelesCantidad: this.panelesCantidad,
              dimensionPanel: this.dimensionPanel,
              panelCapacityW: this.panelCapacityW,
              yearlyEnergyAcKwh: this.yearlyEnergyAcKwh,
              carbonOffsetFactorTnPerMWh: this.carbonOffsetFactorTnPerMWh,
              instalacionPotencia: this.instalacionPotencia,
              // Puedes añadir más campos de resultados si es necesario
            };

            // Llamar al servicio para descargar el PDF
            this.pdfService.downloadPDF(
              resultadosScreenshot,
              graficos,
              resultadosCalculados
            );
          }
        );
      }
    );
  }

  sendEmail(): void {
    if (this.email) {
      this.gmailService.sendEmailWithResults(this.email).then(() => {
        this.snackBar.open('El correo ha sido enviado exitosamente.', '', {
          duration: 5000,
          panelClass: ['custom-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        this.closeModal();
      });
    }
  }

  mostrarAdvertencia(): void {
    this.mostrarModal = true;
  }

  cancelarSalir(): void {
    this.mostrarModal = false;
  }

  confirmarSalir(): void {
    this.mostrarModal = false;
    localStorage.clear();
    this.sharedService.setTarifaContratada('');
    this.mapService.hideDrawingControl();
    this.mapService.clearDrawing();
    this.consumoTarifaService.updateConsumosMensuales([]);
    this.consumoService.setTotalConsumo(0);
    this.sharedService.setTutorialShown(true);
    this.router.navigate(['/pasos/1']);
  }

  goBack() {
    this.mapService.hideDrawingControl();

    this.sharedService.setTutorialShown(true);
    this.router.navigate(['pasos/2']);
  }

  getEmisionesGEIEvitadas() {
    try {
      if (this.resultadosFront) {
        return this.resultadosFront.periodoVeinteanalEmisionesGEIEvitadas;
      }
    } catch (error) {
      console.log('this.resultadosFront no disponible');
    }
    return [];
  }

  getFlujoEnergia() {
    try {
      if (this.resultadosFront) {
        return this.resultadosFront.periodoVeinteanalFlujoEnergia;
      }
    } catch (error) {
      console.log('this.resultadosFront no disponible');
    }
    return [];
  }

  getFlujoIngresosMonetarios() {
    try {
      if (this.resultadosFront) {
        return this.resultadosFront.periodoVeinteanalFlujoIngresosMonetarios;
      }
    } catch (error) {
      console.log('this.resultadosFront no disponible');
    }
    return [];
  }

  getGeneracionFotovoltaica() {
    try {
      if (this.resultadosFront) {
        return this.resultadosFront.periodoVeinteanalGeneracionFotovoltaica;
      }
    } catch (error) {
      console.log('this.resultadosFront no disponible');
    }
    return [];
  }

  getTIR() {
    try {
      if (this.resultadosFront) {
        return this.resultadosFront.resultadosFinancieros.indicadoresFinancieros.TIR.toFixed(
          2
        );
      }
    } catch {
      console.log('this.resultadosFront no disponible');
    }
  }

  getCostoInstalacion() {
    return 3500;
  }

  enabledDrawing() {
    this.polygons = this.mapService.getPolygons();
    this.polygons[0].setEditable(true);
    this.mapService.setDrawingMode(null);

    // Mostrar el snackbar
    this.snackBar.open('Superficie editable', '', {
      duration: 5000,
      panelClass: ['custom-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
