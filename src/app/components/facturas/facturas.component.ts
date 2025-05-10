import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-facturas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h3>Facturación</h3>
      </div>
      <div class="facturas-list">
        <div *ngFor="let factura of facturas" class="factura-item">
          <div class="factura-info">
            <h4>{{factura.servicio}}</h4>
            <p>Fecha: {{factura.fecha | date:'medium'}}</p>
            <p>Monto: {{factura.monto | currency:'MXN'}}</p>
          </div>
          <button class="btn btn-primary" (click)="descargarXML(factura)">
            Descargar Comprobante
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .facturas-list {
      padding: 20px;
    }
    .factura-item {
      border-bottom: 1px solid #eee;
      padding: 15px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .factura-actions {
      margin-left: 20px;
    }
  `]
})
export class FacturasComponent implements OnInit {
  facturas: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Simulated facturas data
    this.facturas = [
      {
        id: 1,
        servicio: 'Paseo Básico',
        fecha: new Date(),
        monto: 150
      },
      // Add more test data as needed
    ];
  }

  descargarXML(factura: any) {
    const xmlContent = this.generarXML(factura);
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura_${factura.id}.xml`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  private generarXML(factura: any): string {
    const fecha = new Date().toISOString();
    const folio = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const subtotal = factura.monto;
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante
  xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  Version="4.0"
  Serie="A"
  Folio="${folio}"
  Fecha="${fecha}"
  FormaPago="01"
  SubTotal="${subtotal.toFixed(2)}"
  Moneda="MXN"
  Total="${total.toFixed(2)}"
  TipoDeComprobante="I"
  MetodoPago="PUE"
  LugarExpedicion="44100">
  
  <cfdi:Emisor
    Rfc="PPE250101XX1"
    Nombre="Patitas Felices"
    RegimenFiscal="601"/>
    
  <cfdi:Conceptos>
    <cfdi:Concepto
      ClaveProdServ="90111501"
      Cantidad="1"
      ClaveUnidad="E48"
      Unidad="Servicio"
      Descripcion="${factura.servicio}"
      ValorUnitario="${subtotal.toFixed(2)}"
      Importe="${subtotal.toFixed(2)}"
      ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado
            Base="${subtotal.toFixed(2)}"
            Impuesto="002"
            TipoFactor="Tasa"
            TasaOCuota="0.160000"
            Importe="${iva.toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
  
  <cfdi:Impuestos TotalImpuestosTrasladados="${iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado
        Base="${subtotal.toFixed(2)}"
        Impuesto="002"
        TipoFactor="Tasa"
        TasaOCuota="0.160000"
        Importe="${iva.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
</cfdi:Comprobante>`;
  }
}
