import { Injectable } from '@angular/core';
import { EnvironmentService } from './environment.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private mapsLoaded = false;

  constructor(private environmentService: EnvironmentService) {}

  loadGoogleMaps(): Promise<void> {
    if (this.mapsLoaded) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.environmentService.loadGoogleMapsApiKey().subscribe({
        next: () => {
          const apiKey = this.environmentService.getGoogleMapsApiKey();
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,places`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            this.mapsLoaded = true;
            resolve();
          };
          script.onerror = (error: any) => reject(error);
          document.head.appendChild(script);
        },
        error: () => {}
      });
    });
  }
}
