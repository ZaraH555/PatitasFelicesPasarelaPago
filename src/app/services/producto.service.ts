import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Producto } from '../models/producto';
import { isPlatformBrowser } from '@angular/common';
import { catchError, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = 'http://localhost:3000/api/productos';
  private xmlUrl = 'assets/productos.xml';
  private productosSubject = new BehaviorSubject<Producto[]>([]);
  productos$ = this.productosSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.cargarProductos();
  }

  actualizarProductos(productos: Producto[]): void {
    this.productosSubject.next(productos);
    this.guardarXML(productos);
  }

  private guardarXML(productos: Producto[]): void {
    if (isPlatformBrowser(this.platformId)) {
      const xmlString = this.generarXML(productos);
      localStorage.setItem('productosXML', xmlString);
      this.cargarProductos(); // Reload to ensure sync
    }
  }

  private generarXML(productos: Producto[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const productosXML = productos.map(prod => `
      <producto>
        <id>${prod.id}</id>
        <nombre>${this.escapeXML(prod.nombre)}</nombre>
        <precio>${prod.precio}</precio>
        <cantidad>${prod.cantidad}</cantidad>
        <imagen>${this.escapeXML(prod.imagen)}</imagen>
      </producto>
    `).join('');
    
    return `${xmlHeader}\n<productos>${productosXML}</productos>`;
  }

  private escapeXML(str: string): string {
    return str.toString().replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  private cargarProductos(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedXML = localStorage.getItem('productosXML');
      if (savedXML) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(savedXML, 'text/xml');
        const productos = Array.from(xmlDoc.querySelectorAll('producto')).map(prod => ({
          id: Number(prod.getElementsByTagName('id')[0]?.textContent),
          nombre: prod.getElementsByTagName('nombre')[0]?.textContent ?? '',
          precio: Number(prod.getElementsByTagName('precio')[0]?.textContent),
          cantidad: Number(prod.getElementsByTagName('cantidad')[0]?.textContent),
          imagen: prod.getElementsByTagName('imagen')[0]?.textContent ?? ''
        }));
        this.productosSubject.next(productos);
      } else {
        this.http.get(this.xmlUrl, { responseType: 'text' }).subscribe(xml => {
          localStorage.setItem('productosXML', xml);
          this.cargarProductos();
        });
      }
    }
  }

  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl).pipe(
      retry(1),
      catchError((error: HttpErrorResponse) => {
        console.error('Error details:', error);
        return throwError(() => new Error('Failed to load products. Please try again later.'));
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.status === 0) {
      // Client-side or network error
      errorMessage = 'Network error occurred. Please check your connection.';
    } else {
      // Backend error
      errorMessage = `Backend returned code ${error.status}, body was: ${error.error}`;
    }
    
    console.error('Error details:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  agregarProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, producto);
  }

  actualizarProducto(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto);
  }

  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  actualizarCantidad(id: number, nuevaCantidad: number): void {
    const productos = this.productosSubject.value;
    const index = productos.findIndex(p => p.id === id);
    if (index !== -1) {
      productos[index] = { ...productos[index], cantidad: nuevaCantidad };
      this.actualizarProductos(productos); 
    }
  }
}