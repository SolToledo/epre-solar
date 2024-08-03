import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { EnvironmentService } from './services/environment.service';
import { firstValueFrom } from 'rxjs';
import { BrowserModule } from '@angular/platform-browser';

export function initializeApp(environmentService: EnvironmentService): () => Promise<void> {
  return (): Promise<void> => firstValueFrom(environmentService.loadGoogleMapsApiKey());
}

@NgModule({
  imports: [HttpClientModule, BrowserModule],
  providers: [
    EnvironmentService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [EnvironmentService],
      multi: true,
    },
  ],
})
export class AppConfigModule {}
