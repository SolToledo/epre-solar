import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GmailService {
  private apiUrl = 'http://localhost:3000';
  // private apiUrl = 'https://0l5cvs6h-3000.brs.devtunnels.ms';
  constructor(private http: HttpClient) {}

  async sendEmailWithResults(email: string): Promise<void> {
    this.http.get<any>(`${this.apiUrl}/gmail/send-email`, {
      params: { email }
    }).subscribe({
      next: () => console.log('Email enviado exitosamente...'),
      error: (error) => console.error('Error al enviar el email:', error),
    });
  }

  async sendEmailChangeCapacityInApi(newPanelCapacityW: number): Promise<void> {
    this.http.get<any>(`${this.apiUrl}/gmail/send-email-change?newPanelCapacityW=${newPanelCapacityW}`).subscribe({
      next: () => console.log('actualizacion enviada ...'),
      error: (error) => console.error(error),
    })
  }
}
