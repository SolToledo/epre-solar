import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-plazo',
  templateUrl: './plazo.component.html',
  styleUrls: ['./plazo.component.css'],
})
export class PlazoComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  plazoRecuperoInitial: number = 0;
  plazoRecupero: number = 0;
  yearlyEnergykWhInitial!: number;
  yearlyEnergykWh!: number;
  potenciaInstalacionInitialkW!: number;
  installationCostInitial!: number;
  factorPotencia: number = 1;
  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sharedService.factorPotencia$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((newFactorPotencia: number) => {
        console.log('Nuevo valor de factorPotencia recibido:', newFactorPotencia);
        this.factorPotencia = newFactorPotencia;
      });

    this.sharedService.plazoInversion$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((newPlazoRecupero) => {
        this.plazoRecupero = newPlazoRecupero;
      });
      
  }
  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {}

}
