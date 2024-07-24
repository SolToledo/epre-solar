import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GmailService {
  private apiUrl = 'http://localhost:3000';
  constructor(private http: HttpClient) {}

  async sendEmailWithResults(): Promise<void> {
    this.http.get<any>(`${this.apiUrl}/gmail/send-email`).subscribe({
      next: () => console.log("email enviado exitosamente ..."),
      error: (error) => console.error(error)
    })
  }
}
