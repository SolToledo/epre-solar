import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GeocodingService } from './geocoding.service';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private predefinedLocations = [
    {
      lat: -31.658,
      lng: -68.277,
      energiaGeneradaAnual: 5820.48,
      irradiacionAnual: 2062.23,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.595,
      lng: -68.401,
      energiaGeneradaAnual: 5851.31,
      irradiacionAnual: 2069.54,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.517,
      lng: -68.352,
      energiaGeneradaAnual: 5836.99,
      irradiacionAnual: 2068.55,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.829,
      lng: -68.246,
      energiaGeneradaAnual: 5714.21,
      irradiacionAnual: 2033.51,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.813,
      lng: -68.328,
      energiaGeneradaAnual: 5757.5,
      irradiacionAnual: 2041.43,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.897,
      lng: -68.38,
      energiaGeneradaAnual: 5763.62,
      irradiacionAnual: 2045.35,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.981,
      lng: -68.427,
      energiaGeneradaAnual: 5762.78,
      irradiacionAnual: 2033.96,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -32.002,
      lng: -68.762,
      energiaGeneradaAnual: 5890.01,
      irradiacionAnual: 2028.6,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.821,
      lng: -68.54,
      energiaGeneradaAnual: 5907.69,
      irradiacionAnual: 2071.04,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.72,
      lng: -68.583,
      energiaGeneradaAnual: 5970.11,
      irradiacionAnual: 2091.29,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.656,
      lng: -68.575,
      energiaGeneradaAnual: 5947.32,
      irradiacionAnual: 2093.13,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.683,
      lng: -68.472,
      energiaGeneradaAnual: 5666.08,
      irradiacionAnual: 1997.17,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.44,
      lng: -68.518,
      energiaGeneradaAnual: 5998.88,
      irradiacionAnual: 2109.98,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.562,
      lng: -68.727,
      energiaGeneradaAnual: 6010.68,
      irradiacionAnual: 2093.72,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.528,
      lng: -68.703,
      energiaGeneradaAnual: 5886.13,
      irradiacionAnual: 2046.8,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.457,
      lng: -68.72,
      energiaGeneradaAnual: 6098.81,
      irradiacionAnual: 2125.24,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.334,
      lng: -69.421,
      energiaGeneradaAnual: 6567.87,
      irradiacionAnual: 2298.79,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -30.422,
      lng: -69.228,
      energiaGeneradaAnual: 6808.67,
      irradiacionAnual: 2318.17,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -30.163,
      lng: -67.843,
      energiaGeneradaAnual: 5858.31,
      irradiacionAnual: 2055.4,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.648,
      lng: -69.472,
      energiaGeneradaAnual: 6419.3,
      irradiacionAnual: 2233.74,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -30.323,
      lng: -69.211,
      energiaGeneradaAnual: 6736.88,
      irradiacionAnual: 2283.57,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -30.198,
      lng: -69.109,
      energiaGeneradaAnual: 6769.55,
      irradiacionAnual: 2331.18,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -30.237,
      lng: -68.752,
      energiaGeneradaAnual: 6326.71,
      irradiacionAnual: 2213.65,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.524,
      lng: -68.63,
      energiaGeneradaAnual: 5984.04,
      irradiacionAnual: 2097.96,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.541,
      lng: -68.635,
      energiaGeneradaAnual: 5973.43,
      irradiacionAnual: 2090.94,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.387,
      lng: -68.483,
      energiaGeneradaAnual: 5981.36,
      irradiacionAnual: 2100.45,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.45,
      lng: -68.405,
      energiaGeneradaAnual: 5937.01,
      irradiacionAnual: 2091.04,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.496,
      lng: -68.415,
      energiaGeneradaAnual: 5961.34,
      irradiacionAnual: 2101.84,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.538,
      lng: -68.419,
      energiaGeneradaAnual: 5894.93,
      irradiacionAnual: 2069.53,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.554,
      lng: -68.333,
      energiaGeneradaAnual: 5838.92,
      irradiacionAnual: 2069.88,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -31.954,
      lng: -68.657,
      energiaGeneradaAnual: 5980.79,
      irradiacionAnual: 2072.77,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -30.954,
      lng: -67.304,
      energiaGeneradaAnual: 5669.94,
      irradiacionAnual: 1951.16,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
    {
      lat: -30.157,
      lng: -68.484,
      energiaGeneradaAnual: 6089.49,
      irradiacionAnual: 2135.85,
      cantidadDePaneles: 10,
      potenciaInstalada: 4,
    },
  ];

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

    // Verifica si la ubicación está cerca de alguna de las ubicaciones predeterminadas
    const nearbyLocation = this.findNearbyLocation(lat, lng);

    if (lat >= -31.878 && lat <= -30.175 && lng >= -69.192 && lng <= -66.879) {
      map.setZoom(20);
      if (marker) {
        marker.position = location;
      }
      return location;
    } else if (nearbyLocation) {
      this.requestSavingsCalculation(nearbyLocation);
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

  private findNearbyLocation(lat: number, lng: number) {
    const maxDistance = 0.01; // Distancia máxima en grados (~1km)
    return this.predefinedLocations.find((location) => {
      const distance = Math.sqrt(
        Math.pow(location.lat - lat, 2) + Math.pow(location.lng - lng, 2)
      );
      return distance < maxDistance;
    });
  }

  private requestSavingsCalculation(location: any) {
    console.log('con las coordenadas de samuel :', location);
  }
}
