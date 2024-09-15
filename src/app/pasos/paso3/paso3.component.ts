import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GmailService } from 'src/app/services/gmail.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SolarApiService } from 'src/app/services/solar-api.service';
import { SharedService } from 'src/app/services/shared.service';
import { ResultadosFrontDTO } from '../../interfaces/resultados-front-dto';
import { DimensionPanel } from 'src/app/interfaces/dimension-panel';
import { MapService } from 'src/app/services/map.service';
import { ConsumoTarifaService } from 'src/app/services/consumo-tarifa.service';
import { ConsumoService } from 'src/app/services/consumo.service';
import { NearbyLocationService } from 'src/app/services/nearby-location.service';
import { Paso2Component } from '../paso2/paso2.component';
import { PdfService } from 'src/app/services/pdf.service';
import { ParametrosFront } from 'src/app/interfaces/parametros-front';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-paso3',
  templateUrl: './paso3.component.html',
  styleUrls: ['./paso3.component.css'],
})
export class Paso3Component implements OnInit, OnDestroy {
  isModalOpen = false;
  email: string = '';
  costoInstalacion!: number;
  private destroy$ = new Subject<void>();
  timestamp: string = '';
  potenciaPanelHip!: number;
  eficienciaInstalacion!: number;
  degradacionAnualPanel!: number;
  proporcionInyectada!: number;
  costoEquipoMedicion!: number;
  costoMantenimiento!: number;
  tasaInflacionUsd!: number;
  fechaActual!: string;
  categoriaTarifa!: string;
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
  yearlyEnergyAckWhDefault: number = 0;
  yearlyEnergyInitial!: number;
  proporcionAutoconsumo: number = 0;
  consumoTotalAnual: number = 0;
  paso2!: Paso2Component;
  isDownloading: boolean = false;
  periodoVeinteanalCasoConCapitalPropioInitial!: any[];
  potenciaContratadaHip!: number;
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
    this.sharedService.isLoading$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => (this.isLoading = value),
    });
    this.actualizarFecha();
  }

  ngOnInit(): void {
    this.sharedService.setIsLoading(true);
    setTimeout(() => {
      this.mapService.recenterMapToVisibleArea();
    }, 300);

    this.setTimestamp();

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
          // this.router.navigate(['/pasos/1']);
        });
    } else {
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initialLoadFields(): void {
    const yearlyAnualConfigurations =
      this.resultadosFront.solarData.panels.yearlysAnualConfigurations ?? [];

    if (yearlyAnualConfigurations) {
      this.sharedService.setYearlysAnualConfigurations(
        yearlyAnualConfigurations
      );
    }
    this.yearlyEnergyAckWhDefault = parseFloat(
      this.resultadosFront.solarData.yearlyEnergyAcKwh.toFixed(0)
    );
    this.yearlyEnergyInitial = this.yearlyEnergyAckWhDefault;
    this.sharedService.setYearlyEnergyAckWh(this.yearlyEnergyInitial);
    this.panelesCantidad =
      this.resultadosFront.solarData.panels.panelsSelected ??
      this.resultadosFront.solarData.panels.panelsCountApi;
    this.dimensionPanel = this.resultadosFront.solarData.panels.panelSize;
    this.sharedService.setPanelsCountSelected(this.panelesCantidad);
    this.sharedService.setDimensionPanels(this.dimensionPanel);
    this.panelCapacityW = this.resultadosFront.solarData.panels.panelCapacityW;
    this.sharedService.setPanelCapacityW(this.panelCapacityW);
    const eficienciaInstalacion = this.resultadosFront.parametros?.caracteristicasSistema.eficienciaInstalacion || 0.95;
    this.sharedService.setEficienciaInstalacion(eficienciaInstalacion);
    this.sharedService.panelCapacityW$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (capacity) => (this.potenciaPanelHip = capacity),
      });
    this.costoInstalacion =
      this.resultadosFront.resultadosFinancieros.casoConCapitalPropio[0].inversiones;
    this.sharedService.setCostoInstalacion(this.costoInstalacion);
    this.sharedService.setPlazoInversion(
      this.resultadosFront.resultadosFinancieros.indicadoresFinancieros
        .payBackMonths
    );
    this.periodoVeinteanalCasoConCapitalPropioInitial =
      this.resultadosFront.resultadosFinancieros.casoConCapitalPropio;

    const cargos = this.resultadosFront.periodoVeinteanalProyeccionTarifas[0];

    this.sharedService.setTarifaIntercambioUsdkWh(
      cargos.cargoVariableConsumoUsdkWh
    );

    this.carbonOffsetFactorTnPerMWh = parseFloat(
      (
        this.resultadosFront.solarData.carbonOffsetFactorKgPerMWh / 1000
      ).toFixed(3)
    );
    const parametros: ParametrosFront = this.resultadosFront.parametros!;
    console.log('parametros ', parametros);

    this.eficienciaInstalacion =
      parametros.caracteristicasSistema.eficienciaInstalacion;
    this.degradacionAnualPanel =
      parametros.caracteristicasSistema.degradacionAnualPanel;
    this.proporcionAutoconsumo =
      parametros.caracteristicasSistema.proporcionAutoconsumo;
    this.proporcionInyectada =
      parametros.caracteristicasSistema.proporcionInyeccion;
    this.costoEquipoMedicion =
      parametros.inversionCostos.equipoDeMedicionUsdAplicado;
    this.costoMantenimiento =
      parametros.inversionCostos.costoDeMantenimientoInicialUsd;
    this.tasaInflacionUsd = parametros.economicas.tasaInflacionUsd;
    this.potenciaContratadaHip = this.sharedService.getPotenciaMaxAsignadaValue();
    this.consumoService.totalConsumo$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => (this.consumoTotalAnual = value),
    });

    this.sharedService.tarifaContratada$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tarifa) => (this.categoriaTarifa = tarifa),
      });
  }

  downloadPDF(): void {
    if (!this.isDownloading) {
      this.isDownloading = true;
      this.pdfService
        .generatePDF(true)
        .then(() => { })
        .catch(() => { })
        .finally(() => (this.isDownloading = false));
    }
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

  // Método para establecer el timestamp
  private setTimestamp() {
    const date = new Date();
    const userAgent = navigator.userAgent;
    const browserVersion = this.getBrowserVersion(userAgent);

    this.timestamp = `${date.toLocaleDateString()} ${date.toLocaleTimeString()} - Navegador: ${browserVersion}`;
  }

  // Método auxiliar para obtener la versión del navegador
  private getBrowserVersion(userAgent: string): string {
    if (userAgent.indexOf('Firefox') > -1) {
      return 'Firefox ' + userAgent.split('Firefox/')[1];
    } else if (userAgent.indexOf('Chrome') > -1) {
      return 'Chrome ' + userAgent.split('Chrome/')[1].split(' ')[0];
    } else if (
      userAgent.indexOf('Safari') > -1 &&
      userAgent.indexOf('Chrome') === -1
    ) {
      return 'Safari ' + userAgent.split('Version/')[1].split(' ')[0];
    } else if (userAgent.indexOf('Edg') > -1) {
      return 'Edge ' + userAgent.split('Edg/')[1];
    } else {
      return 'Navegador desconocido';
    }
  }

  private actualizarFecha() {
    const now = new Date();
    const meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];

    const mes = meses[now.getMonth()];
    const anio = now.getFullYear();

    this.fechaActual = `${mes} de ${anio}`;
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}
