import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-emisiones',
  templateUrl: './emisiones.component.html',
  styleUrls: ['./emisiones.component.css'],
})
export class EmisionesComponent implements OnInit, OnDestroy {
  @Input()
  carbonOffsetFactorTnPerMWh!: number;
  yearlyEnergyAcKwh: number = 0;
  carbonOffset: number = 0;
  private subscription!: Subscription;

  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = this.sharedService.yearlyEnergyAcKwh$.subscribe(
      (value) => {
        this.yearlyEnergyAcKwh = value;
        this.calculateCarbonOffset();
      }
    );
  }

  calculateCarbonOffset(): void {
    const result = this.yearlyEnergyAcKwh * this.carbonOffsetFactorTnPerMWh / 1000;
    this.carbonOffset = parseFloat(result.toFixed(2));
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
