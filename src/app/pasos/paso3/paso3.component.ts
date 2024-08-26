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
  /* isPredefinedCoordinates = this.sharedService.predefinedCoordinates$.subscribe(
    {
      next: (value) => value,
    }
  ); */
  yearlyEnergyAcKwh: number = 0;
  proporcionAutoconsumo: number = 0;
  consumoTotalAnual: number = 0;

  constructor(
    private router: Router,
    private readonly gmailService: GmailService,
    private snackBar: MatSnackBar,
    private solarService: SolarApiService,
    private sharedService: SharedService,
    private mapService: MapService,
    private consumoTarifaService: ConsumoTarifaService,
    private consumoService: ConsumoService,
    private nearbyService: NearbyLocationService
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
        .catch((error) => console.error('Error en calculate:', error));
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
    console.log(this.resultadosFront);

    this.panelesCantidad = this.resultadosFront.solarData.panels.panelsCountApi;
    this.dimensionPanel = this.resultadosFront.solarData.panels.panelSize;
    this.panelCapacityW = this.resultadosFront.solarData.panels.panelCapacityW;

    this.yearlyEnergyAcKwh = parseFloat(
      this.resultadosFront.solarData.yearlyEnergyAcKwh.toFixed(0)
    );
    this.sharedService.setYearlyEnergyAcKwh(this.yearlyEnergyAcKwh);
    this.sharedService.setPanelCapacityW(this.panelCapacityW);
    this.sharedService.setPanelsCountSelected(this.panelesCantidad);
    this.carbonOffsetFactorTnPerMWh = parseFloat(
      (
        this.resultadosFront.solarData.carbonOffsetFactorKgPerMWh / 1000
      ).toFixed(3)
    );

    this.proporcionAutoconsumo = 85;

    this.sharedService.setPlazoInversion(
      this.resultadosFront.resultadosFinancieros.indicadoresFinancieros
        .payBackSimpleYears * 12
    );

    this.consumoService.totalConsumo$.subscribe({
      next: (value) => (this.consumoTotalAnual = value),
    });
  }

  print(): void {
    window.print();
  }

  downloadPDF(): void {
    const data = document.getElementById('contentToConvert') as HTMLElement;
    html2canvas(data).then((canvas) => {
      const imgWidth = 208;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const heightLeft = imgHeight;

      const contentDataURL = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const position = 0;

      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight);

      pdf.save('resultados.pdf');
    });
  }

  sendEmail(): void {
    if (this.email) {
      // Lógica para enviar el correo utilizando el email ingresado
      this.gmailService.sendEmailWithResults().then(() => {
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
      this.snackBar.open('Ya puedes editar la superficie', '', {
      duration: 5000,
      panelClass: ['custom-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
