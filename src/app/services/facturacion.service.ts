import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerFacturas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/facturas`).pipe(
      tap(facturas => console.log('Facturas obtenidas:', facturas))
    );
  }

  generarFacturaXML(paseoId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/generate-invoice`, 
      { paseoId }, 
      { responseType: 'text' }
    ).pipe(
      tap(() => console.log('XML generado para paseo:', paseoId))
    );
  }

  guardarFactura(facturaXML: string, paseoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/facturas/guardar`, {
      xml: facturaXML,
      paseoId
    });
  }

  obtenerFacturaPorId(facturaId: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/facturas/${facturaId}/xml`, 
      { responseType: 'text' }
    );
  }
}
