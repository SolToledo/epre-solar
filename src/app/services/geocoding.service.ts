// geocoding.service.ts
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  constructor(private snackBar: MatSnackBar) {}

  geocodeAddress(
    address: string,
    map: google.maps.Map,
    marker: google.maps.marker.AdvancedMarkerElement
  ): Promise<google.maps.LatLngLiteral> {
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, async (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          const location = results[0].geometry.location;
          resolve(location.toJSON());
        } else {
          this.snackBar.open(
            'No se encontró la ubicación. Intente de nuevo.',
            '',
            {
              duration: 3000,
              panelClass: ['custom-snackbar'],
            }
          );
          reject('No se encontró la ubicación');
        }
      });
    });
  }

  initializeAutocomplete(
    inputElement: HTMLInputElement,
    map: google.maps.Map,
    marker: google.maps.marker.AdvancedMarkerElement
  ) {
    const searchBox = new google.maps.places.SearchBox(inputElement);

    map.addListener('bounds_changed', () => {
      searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
    });

    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          const location = place.geometry.location;
          map.setCenter(location);
          marker.position = location.toJSON();
        }
      }
    });
  }
}
