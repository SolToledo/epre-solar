/*import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-terminos',
  templateUrl: './terminos.component.html',
  styleUrls: ['./terminos.component.css']
})
export class TerminosComponent {
  @Input() isVisible: boolean = false;
  @Output() accepted = new EventEmitter<boolean>();
  isTermsAccepted: boolean = false;

  closeModal() {
    this.isVisible = false;
    this.accepted.emit(false);
  }

  acceptTerms() {
    if (this.isTermsAccepted) {
      this.isVisible = false;
      this.accepted.emit(true);
    }
  }

  toggleAcceptButton(event: Event) {
    this.isTermsAccepted = (event.target as HTMLInputElement).checked;
  }
}*/

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-terminos',
  templateUrl: './terminos.component.html',
  styleUrls: ['./terminos.component.css']
})
export class TerminosComponent implements AfterViewInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Output() accepted = new EventEmitter<boolean>();
  @ViewChild('termsContent') termsContent!: ElementRef;

  isTermsAccepted: boolean = false;
  isCheckboxEnabled: boolean = false;
  scrollListener: () => void = () => {};

  ngAfterViewInit() {
    if (this.termsContent) {
      this.scrollListener = this.onScroll.bind(this);
      this.termsContent.nativeElement.addEventListener('scroll', this.scrollListener);
      this.onScroll(); // Llama a onScroll para comprobar el estado inicial
    }
  }

  ngOnDestroy() {
    if (this.termsContent) {
      this.termsContent.nativeElement.removeEventListener('scroll', this.scrollListener);
    }
  }

  onScroll() {
    const element = this.termsContent.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
  
    // Verifica si el usuario ha llegado a la mitad del contenedor
    this.isCheckboxEnabled = (scrollTop + clientHeight) >= (scrollHeight * 0.5); // Ajusta este valor según sea necesario
  }
  

  closeModal() {
    this.isVisible = false;
    this.accepted.emit(false);
  }

  acceptTerms() {
    if (this.isTermsAccepted) {
      this.isVisible = false;
      this.accepted.emit(true);
    }
  }

  toggleAcceptButton(event: Event) {
    this.isTermsAccepted = (event.target as HTMLInputElement).checked;
  }
}
