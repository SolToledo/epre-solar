import { Component, Input, Output, EventEmitter } from '@angular/core';

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
}
