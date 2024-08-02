import { Injectable } from '@angular/core';
import { EnvironmentService } from './environment.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {

  constructor(private environmentService: EnvironmentService) {}
  
}
