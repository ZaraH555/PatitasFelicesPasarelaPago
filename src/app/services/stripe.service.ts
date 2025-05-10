import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  private apiUrl = `${environment.apiUrl}/stripe`;

  constructor(private http: HttpClient) {}

  createPaymentIntent(amount: number, servicioId: number, mascotaId: number): Observable<{clientSecret: string}> {
    return this.http.post<{clientSecret: string}>(`${this.apiUrl}/create-payment-intent`, {
      amount,
      servicioId,
      mascotaId
    });
  }

  generateInvoice(paymentData: any): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/generate-invoice`, paymentData);
  }

  confirmPayment(paymentIntentId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/confirm-payment`, { paymentIntentId });
  }
}
