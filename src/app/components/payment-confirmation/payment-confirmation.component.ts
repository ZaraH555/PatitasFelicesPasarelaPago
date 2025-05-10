import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payment-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h3>Confirmación de Pago</h3>
      </div>
      <div class="card-body">
        <div *ngIf="success" class="success-message">
          <h4>¡Pago exitoso!</h4>
          <p>Tu paseo ha sido confirmado.</p>
          <p>Número de sesión: {{sessionId}}</p>
          <button class="btn btn-primary" (click)="descargarComprobante()">
            Descargar Comprobante
          </button>
        </div>
        <div *ngIf="!success" class="error-message">
          <p>Hubo un problema con tu pago. Por favor intenta nuevamente.</p>
        </div>
        <button class="btn btn-secondary" (click)="volver()">Volver al inicio</button>
      </div>
    </div>
  `,
  styles: [`
    .success-message { color: var(--primary-color); }
    .error-message { color: #dc3545; }
    .btn { margin-top: 1rem; }
  `]
})
export class PaymentConfirmationComponent implements OnInit {
  sessionId: string | null = null;
  success: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (this.sessionId) {
      this.verificarPago();
    }
  }

  verificarPago() {
    this.http.get(`http://localhost:3000/api/checkout-session/${this.sessionId}`)
      .subscribe({
        next: (session: any) => {
          this.success = session.payment_status === 'paid';
        },
        error: (error) => {
          console.error('Error al verificar pago:', error);
          this.success = false;
        }
      });
  }

  descargarComprobante() {
    if (this.sessionId) {
      this.http.post('http://localhost:3000/api/generate-invoice', 
        { sessionId: this.sessionId },
        { responseType: 'blob' }
      ).subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${this.sessionId}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    }
  }

  volver() {
    this.router.navigate(['/']);
  }
}
