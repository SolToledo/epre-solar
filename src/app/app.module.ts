import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms'; // Importa FormsModule
import { LazyLoadImageModule } from 'ng-lazyload-image'; // Importa el módulo



import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { Paso1Component } from './pasos/paso1/paso1.component';
import { Paso2Component } from './pasos/paso2/paso2.component';
import { Paso3Component } from './pasos/paso3/paso3.component';
import { MapaComponent } from './mapa/mapa.component';
import { LayoutPasosComponent } from './layout-pasos/layout-pasos.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { ToolbarPasosComponent } from './pasos/toolbar-pasos/toolbar-pasos.component';

import { ConsumoComponent } from './pasos/paso2/consumo/consumo.component';
import { GraficosComponent } from './pasos/paso3/graficos/graficos.component';
import { TarifaComponent } from './pasos/paso2/tarifa/tarifa.component';
import { ResultadoComponent } from './pasos/paso2/resultado/resultado.component';
import { EnergiaComponent } from './pasos/paso3/energia/energia.component';
import { PanelesComponent } from './pasos/paso3/paneles/paneles.component';
import { RetornoComponent } from './pasos/paso3/retorno/retorno.component';
import { TerminosComponent } from './terminos/terminos.component';
import { Paso0Component } from './pasos/paso0/paso0.component';

//Angular Material
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { AhorroComponent } from './pasos/paso3/ahorro/ahorro.component';
import { PlazoComponent } from './pasos/paso3/plazo/plazo.component';
import { PotenciaComponent } from './pasos/paso3/potencia/potencia.component';
import { SuperficieComponent } from './pasos/paso3/superficie/superficie.component';
import { CoberturaComponent } from './pasos/paso3/cobertura/cobertura.component';
import { EmisionesComponent } from './pasos/paso3/emisiones/emisiones.component';
import { CostoComponent } from './pasos/paso3/costo/costo.component';
import { TarifaIntercambioComponent } from './pasos/paso3/tarifa-intercambio/tarifa-intercambio.component';
import { TotalComponent } from './pasos/paso2/total/total.component';
import { NgChartsModule } from 'ng2-charts';
import { MatSliderModule } from '@angular/material/slider';
import { GoogleMapsModule } from '@angular/google-maps';
import { AppConfigModule } from './app-config.module';
import { EnvironmentService } from './services/environment.service';
import { firstValueFrom } from 'rxjs';
import { NgxSpinnerModule } from 'ngx-spinner';

export function initializeApp(environmentService: EnvironmentService): () => Promise<void> {
  return (): Promise<void> => firstValueFrom(environmentService.loadGoogleMapsApiKey());
}

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    Paso1Component,
    Paso2Component,
    Paso3Component,
    MapaComponent,
    LayoutPasosComponent,
    ToolbarComponent,
    ToolbarPasosComponent,
    ConsumoComponent,
    GraficosComponent,
    TarifaComponent,
    ResultadoComponent,
    EnergiaComponent,
    PanelesComponent,
    RetornoComponent,
    TerminosComponent,
    Paso0Component,
    AhorroComponent,
    PlazoComponent,
    PotenciaComponent,
    SuperficieComponent,
    CoberturaComponent,
    EmisionesComponent,
    CostoComponent,
    TarifaIntercambioComponent,
    TotalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatCardModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    LazyLoadImageModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatIconModule,
    HttpClientModule,
    NgChartsModule,
    MatSliderModule,
    GoogleMapsModule,
    AppConfigModule,
    NgxSpinnerModule.forRoot()
  ],
  providers: [
    EnvironmentService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [EnvironmentService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent] 
})
export class AppModule { }
