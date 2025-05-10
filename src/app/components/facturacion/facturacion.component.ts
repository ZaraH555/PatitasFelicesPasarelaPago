import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FacturacionService } from '../../services/facturacion.service';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  providers: [FacturacionService],
  template: `
    <div class="card">
      <div class="card-header">
        <h3>Facturación</h3>
      </div>
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Servicio</th>
              <th>Monto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let factura of facturas">
              <td>{{factura.fecha | date}}</td>
              <td>{{factura.servicio_nombre}}</td>
              <td>{{factura.monto | currency:'MXN'}}</td>
              <td>
                <button class="btn btn-primary" (click)="descargarFactura(factura.id)">
                  Descargar XML
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="facturas.length === 0" class="text-center p-3">
          No hay facturas disponibles
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table {
      width: 100%;
      margin-bottom: 1rem;
      border-collapse: collapse;
    }
    .table th,
    .table td {
      padding: 0.75rem;
      border-bottom: 1px solid #dee2e6;
    }
    .btn-primary {
      background-color: var(--primary-color);
      color: white;
      border: none;
      padding: 0.375rem 0.75rem;
      border-radius: var(--border-radius);
      cursor: pointer;
    }
    .btn-primary:hover {
      opacity: 0.9;
    }
  `]
})
export class FacturacionComponent implements OnInit {
  facturas: any[] = [];

  constructor(private facturacionService: FacturacionService) {}

  ngOnInit() {
    this.cargarFacturas();
  }

  cargarFacturas() {
    this.facturacionService.obtenerFacturas().subscribe({
      next: (facturas) => {
        this.facturas = facturas;
      },
      error: (error) => {
        console.error('Error al cargar facturas:', error);
      }
    });
  }

  descargarFactura(id: number) {
    this.facturacionService.generarFacturaXML(id).subscribe({
      next: (xml) => {
        const blob = new Blob([xml], { type: 'text/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${id}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar factura:', error);
        alert('Error al descargar la factura');
      }
    });
  }
}
