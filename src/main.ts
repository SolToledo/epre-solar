import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environments';

if (environment.production) {
  enableProdMode();
}

async function bootstrap() {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=drawing,places,marker`;
  script.async = true;
  script.defer = true;
  script.onload = async () => {
    await platformBrowserDynamic()
      .bootstrapModule(AppModule)
      .catch(err => console.error(err));
    console.log('Google Maps API loaded successfully');
  };
  script.onerror = () => {
    console.error('Error loading Google Maps API');
  };
  document.head.appendChild(script);
}

bootstrap();
