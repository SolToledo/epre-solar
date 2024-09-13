import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { distinctUntilChanged, Subject, Subscription, takeUntil } from 'rxjs';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-plazo',
  templateUrl: './plazo.component.html',
  styleUrls: ['./plazo.component.css'],
})
export class PlazoComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input()
  periodoVeinteanalCasoConCapitalPropioInitial: any;
  plazoRecuperoInversion!: number;


  constructor(
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.plazoRecuperoInversion = this.sharedService.getPlazoInversionValue();
  }

  ngAfterViewInit(): void {
    
   
  }

  ngOnDestroy(): void {
    
  }


 
  
}
