import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StripeService } from '../../services/stripe.service';
import { PaseosService } from '../../services/paseos.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

declare var Stripe: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payment-container">
      <div class="card payment-card">
        <div class="card-header">
          <h3>Resumen del Paseo</h3>
        </div>
        <div class="card-body">
          <div class="payment-summary">
            <p>Mascota: {{mascotaNombre}}</p>
            <p>Servicio: {{servicioNombre}}</p>
            <p class="total">Total a pagar: {{total | currency:'MXN'}}</p>
          </div>
          <div class="button-group">
            <button class="btn btn-primary" (click)="iniciarPago()" [disabled]="procesando">
              {{procesando ? 'Procesando...' : 'Pagar con Stripe'}}
            </button>
            <button class="btn btn-secondary" (click)="volver()">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  @ViewChild('paymentForm') paymentForm!: NgForm;
  
  private stripe: any;
  private card: any;
  private clientSecret: string = '';
  
  mascotaNombre: string = '';
  servicioNombre: string = '';
  total: number = 0;
  procesando: boolean = false;
  servicioId?: number;
  mascotaId?: number;

  constructor(
    private stripeService: StripeService,
    private paseosService: PaseosService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.mascotaId = params['mascotaId'];
      this.servicioId = params['servicioId'];
      this.loadPaymentDetails();
    });

    this.initializeStripe();
  }

  private async loadPaymentDetails() {
    if (this.mascotaId && this.servicioId) {
      // Fetch service and mascota details from database
      const serviceQuery = `SELECT * FROM servicios WHERE id = ${this.servicioId}`;
      const mascotaQuery = `SELECT * FROM mascotas WHERE id = ${this.mascotaId}`;
      
      this.paseosService.getServicios().subscribe(servicios => {
        const servicio = servicios.find(s => s.id === Number(this.servicioId));
        if (servicio) {
          this.servicioNombre = servicio.nombre;
          this.total = servicio.precio;
          this.createPaymentIntent();
        }
      });

      this.paseosService.getMascotas().subscribe(mascotas => {
        const mascota = mascotas.find(m => m.id === Number(this.mascotaId));
        if (mascota) {
          this.mascotaNombre = mascota.nombre;
        }
      });
    }
  }

  private initializeStripe() {
    if (typeof window !== 'undefined' && (window as any).Stripe) {
      this.stripe = (window as any).Stripe(environment.stripePublishableKey);
    }
    const elements = this.stripe.elements();
    
    this.card = elements.create('card');
    this.card.mount('#card-element');

    this.card.addEventListener('change', ({error}: any) => {
      const displayError = document.getElementById('card-errors');
      if (displayError) {
        displayError.textContent = error ? error.message : '';
      }
    });
  }

  private createPaymentIntent() {
    if (!this.total || !this.servicioId || !this.mascotaId) return;

    this.stripeService.createPaymentIntent(this.total, this.servicioId, this.mascotaId)
      .subscribe({
        next: (response) => {
          this.clientSecret = response.clientSecret;
        },
        error: (error) => {
          console.error('Error creating payment intent:', error);
        }
      });
  }

  async iniciarPago() {
    if (!this.servicioId || !this.mascotaId) return;

    this.procesando = true;
    
    try {
      const response = await this.http.post<{url: string}>(
        'http://localhost:3000/api/create-checkout-session',
        {
          servicio: {
            nombre: this.servicioNombre,
            precio: this.total
          },
          mascotaId: this.mascotaId
        }
      ).toPromise();

      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (error) {
      console.error('Error al crear sesión de pago:', error);
      this.procesando = false;
    }
  }

  async procesarPago() {
    if (!this.clientSecret) return;
    
    this.procesando = true;
    
    try {
      const { paymentIntent, error } = await this.stripe.confirmCardPayment(this.clientSecret, {
        payment_method: {
          card: this.card,
          billing_details: {
            name: 'Test User'
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Insert payment record into database
        const paymentData = {
          paseo_id: null, // Will be set after paseo creation
          monto: this.total,
          fecha_pago: new Date().toISOString(),
          metodo_pago: 'card',
          estado: 'exitoso'
        };

        // Generate and download XML invoice
        const xmlData = this.generateInvoiceXML({
          folio: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
          fecha: new Date().toISOString(),
          servicio: this.servicioNombre,
          mascota: this.mascotaNombre,
          monto: this.total,
          impuestos: this.total * 0.16,
          total: this.total * 1.16
        });

        this.downloadXML(xmlData);
        this.router.navigate(['/paseos/confirmacion']);
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorElement = document.getElementById('card-errors');
      if (errorElement) {
        errorElement.textContent = error.message;
      }
    } finally {
      this.procesando = false;
    }
  }

  private generateInvoiceXML(data: any): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante
  xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  Version="4.0"
  Serie="A"
  Folio="${data.folio}"
  Fecha="${data.fecha}"
  SubTotal="${data.monto}"
  Total="${data.total}"
  FormaPago="01"
  MetodoPago="PUE">
  
  <cfdi:Emisor
    Rfc="PPE250101XX1"
    Nombre="Patitas Felices"
    RegimenFiscal="601"/>
    
  <cfdi:Conceptos>
    <cfdi:Concepto
      Descripcion="Servicio de paseo - ${data.servicio} - Mascota: ${data.mascota}"
      ValorUnitario="${data.monto}"
      Importe="${data.monto}"
      ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado
            Base="${data.monto}"
            Impuesto="002"
            TasaOCuota="0.160000"
            Importe="${data.impuestos}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
</cfdi:Comprobante>`;
  }

  private downloadXML(xmlContent: string) {
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura_${new Date().getTime()}.xml`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  volver() {
    this.router.navigate(['/paseos']);
  }
}
