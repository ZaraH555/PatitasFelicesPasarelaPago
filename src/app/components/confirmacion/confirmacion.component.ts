import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
          <p>Tu paseo ha sido registrado exitosamente.</p>
          <div class="button-group">
            <button class="btn btn-primary" (click)="descargarFactura()" *ngIf="xmlContent">
              Descargar Factura
            </button>
            <button class="btn btn-outline" (click)="volverInicio()">
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-card {
      max-width: 600px;
      margin: 2rem auto;
      padding: 0 1rem;
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
export class ConfirmacionComponent implements OnInit {
  xmlContent: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['session_id']) {
        this.createPaseoAndFactura(params);
      }
    });
  }

  private createPaseoAndFactura(params: any) {
    this.http.post<any>('http://localhost:3000/api/paseos/create-from-payment', {
      session_id: params['session_id'],
      servicio_id: params['servicio_id'],
      mascota_id: params['mascota_id']
    }).subscribe({
      next: (response) => {
        if (response.xml) {
          this.xmlContent = response.xml;
        }
      },
      error: (error) => console.error('Error creating paseo:', error)
    });
  }

  descargarFactura() {
    if (!this.xmlContent) return;

    const blob = new Blob([this.xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura_${new Date().getTime()}.xml`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  volverInicio() {
    this.router.navigate(['/mascotas']);
  }
}
