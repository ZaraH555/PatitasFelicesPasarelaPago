import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-confirmacion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirmation-container">
      <div class="card">
        <div class="card-header">
          <h3>¡Pago Confirmado!</h3>
        </div>
        <div class="card-body">
          <p>Tu paseo ha sido agendado exitosamente.</p>
          <div class="button-group">
            <button class="btn btn-primary" (click)="verFactura()">Ver Factura</button>
            <button class="btn btn-outline" (click)="volverInicio()">Volver al Inicio</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .card-header {
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
    }
    .card-body {
      padding: 2rem;
      text-align: center;
    }
    .button-group {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.5rem;
    }
  `]
})
export class ConfirmacionComponent {
  constructor(private router: Router) {}

  verFactura() {
    this.router.navigate(['/facturas']);
  }

  volverInicio() {
    this.router.navigate(['/mascotas']);
  }
}
