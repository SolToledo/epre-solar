import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private tarifaContratada: string = '';

  setTarifaContratada(tarifaContratada: string) {
    this.tarifaContratada = tarifaContratada;
  }
  
  getTarifaContratada(): string {
    return this.tarifaContratada;
  }

  private tutorialShownSubject = new BehaviorSubject<boolean>(false);
  tutorialShown$ = this.tutorialShownSubject.asObservable();

  setTutorialShown(value: boolean): void {
    this.tutorialShownSubject.next(value);
  }
}
