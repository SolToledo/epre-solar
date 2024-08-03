import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GeocodingService } from './geocoding.service';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  constructor(
    private geocodingService: GeocodingService,
    private snackBar: MatSnackBar
  ) {}

  async validateLocation(
    value: string,
    map: google.maps.Map,
    marker: google.maps.marker.AdvancedMarkerElement
  ) {
    const location = await this.geocodingService.geocodeAddress(
      value,
      map,
      marker
    );
    const lat = location.lat;
    const lng = location.lng;

    if (lat >= -31.878 && lat <= -30.175 && lng >= -69.192 && lng <= -66.879) {
      map.setZoom(20);
      if (marker) {
        marker.position = location;
      }
      return location;
    } else {
      const defaultLocation = { lat: -31.5364, lng: -68.50639 };
      map.setZoom(13);
      map.setCenter(defaultLocation);
      marker.position = null;
      this.snackBar.open(
        'La ubicación está fuera de los límites de la provincia de San Juan.',
        '',
        {
          duration: 2000,
          panelClass: ['custom-snackbar'],
        }
      );
      return defaultLocation;
    }
  }
}
