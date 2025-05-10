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
    console.log('Generando factura para paseo:', paseoId);
    return this.http.post(`${this.apiUrl}/generate-invoice`, 
      { paseoId }, 
      { responseType: 'text' }
    ).pipe(
      tap(xml => console.log('XML generado'))
    );
  }
}
