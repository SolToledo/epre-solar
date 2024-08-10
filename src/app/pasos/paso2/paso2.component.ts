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

  @ViewChild('botonSiguiente') botonSiguiente!: ElementRef;
  @ViewChild(TarifaComponent) tarifaComponent!: TarifaComponent;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private mapService: MapService
  ) {}

  ngOnInit(): void {
    this.mapService.hideDrawingControl();
  }

  ngAfterViewInit(): void {}

  goBack() {
    this.router.navigate(['pasos/1']);
  }

  goToPaso3() {
    this.router.navigate(['pasos/3']);
  }

  onAllFieldsCompleted(event: boolean): void {
    this.allFieldsFilled = event;
  }
  onCategorySelected(event: boolean): void {
    this.isCategorySelected = event;
  }

  showTooltip() {
    if (!this.allFieldsFilled || !this.isCategorySelected) {
      this.snackBar.open(
        'Debe ingresar todos los meses para poder continuar.',
        '',
        {
          duration: 2000,
          panelClass: ['custom-snackbar'],
        }
      );
    }
  }

  hideTooltip() {
    this.snackBar.dismiss();
  }
}
