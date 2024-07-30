import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Resultados } from 'src/app/interfaces/resultados';
import { GmailService } from 'src/app/services/gmail.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolarApiService } from 'src/app/services/solar-api.service';
import { SharedService } from 'src/app/services/shared.service';
import { ResultadosFrontDTO } from '../../interfaces/resultados-front-dto';
import { DimensionPanel } from 'src/app/interfaces/dimension-panel';
@Component({
  selector: 'app-paso3',
  templateUrl: './paso3.component.html',
  styleUrls: ['./paso3.component.css'],
})
export class Paso3Component implements OnInit {
  currentStep: number = 3;
  mostrarModal: boolean = false;
  private resultadosFront!: ResultadosFrontDTO;
  plazoRecuperoInversion: number = 0;
  panelesCantidad: number = 0;
  dimensionPanel: DimensionPanel = { height: 0, width: 0 };
  panelCapacityW: number = 0;
  carbonOffsetFactorTnPerMWh: number = 0;

  constructor(
    private router: Router,
    private readonly gmailService: GmailService,
    private snackBar: MatSnackBar,
    private solarService: SolarApiService,
    private sharedService: SharedService
  ) {
    this.solarService
      .calculate()
      .then((resultados) => (this.resultadosFront = resultados))
      .then(() => {
        console.log(this.resultadosFront);
        this.plazoRecuperoInversion =
          this.resultadosFront.resultados._indicadoresFinancieros.payBackSimpleYears;
        this.panelesCantidad =
          this.resultadosFront.solarData.panels.panelsCount;
        this.dimensionPanel = this.resultadosFront.solarData.panels.panelSize;
        this.panelCapacityW =
          this.resultadosFront.solarData.panels.panelCapacityW;
        this.carbonOffsetFactorTnPerMWh = parseFloat((this.resultadosFront.solarData.carbonOffsetFactorKgPerMWh / 1000).toFixed(2));
      })
      
  }
  ngOnInit(): void {}

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
    this.gmailService.sendEmailWithResults().then(() => {
      this.snackBar.open('El correo ha sido enviado exitosamente.', '', {
        duration: 3000,
        panelClass: ['custom-snackbar'],
      });
    });
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
    this.router.navigate(['/pasos/1']).then(() => {
      this.sharedService.setTutorialShown(true);
    });
  }

  goBack() {
    this.router.navigate(['pasos/2']);
  }

  getEmisionesGEIEvitadas() {
    return this.resultadosFront.periodoVeinteanalEmisionesGEIEvitadas;
  }
  
  getFlujoEnergia() {
    return this.resultadosFront.periodoVeinteanalFlujoEnergia;
  }
  
  getFlujoIngresosMonetarios() {
    return this.resultadosFront.periodoVeinteanalFlujoIngresosMonetarios;
  }

  getGeneracionFotovoltaica() {
    return this.resultadosFront.periodoVeinteanalGeneracionFotovoltaica;
  }

  getTIR() {
    return (this.resultadosFront.resultados._indicadoresFinancieros.TIR).toFixed(2);
  }

  getCostoInstalacion() {
    return 3500;
  }
}
