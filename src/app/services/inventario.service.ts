import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, tap, throwError } from 'rxjs';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = 'http://localhost:3000/api/productos';
  private productosSubject = new BehaviorSubject<Producto[]>([]);
  productos$ = this.productosSubject.asObservable();

  constructor(private http: HttpClient) {
    this.cargarProductos();
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error en la operación';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    
    console.error('Error details:', error);
    return throwError(() => new Error(errorMessage));
  }

  cargarProductos() {
    this.http.get<Producto[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      )
      .subscribe({
        next: (productos) => this.productosSubject.next(productos),
        error: (error) => console.error('Error loading products:', error.message)
      });
  }

  modificarProducto(id: number, producto: Producto) {
    const productoToUpdate = {
      ...producto,
      precio: Number(producto.precio),
      cantidad: Number(producto.cantidad)
    };

    console.log('Updating product:', productoToUpdate);

    return this.http.put<Producto>(`${this.apiUrl}/${id}`, productoToUpdate)
      .pipe(
        tap(response => {
          console.log('Server response:', response);
          this.cargarProductos();
        }),
        catchError(this.handleError)
      )
      .subscribe({
        next: () => {
          alert('Producto modificado exitosamente');
        },
        error: (error) => {
          console.error('Error updating product:', error);
          alert(`Error al modificar el producto: ${error.message}`);
        }
      });
  }

  agregarProducto(producto: Producto) {
    const productoToAdd = {
      ...producto,
      precio: Number(producto.precio),
      cantidad: Number(producto.cantidad)
    };

    return this.http.post<Producto>(this.apiUrl, productoToAdd)
      .pipe(
        tap(() => this.cargarProductos()),
        catchError(this.handleError)
      )
      .subscribe({
        next: () => {
          this.cargarProductos();
          alert('Producto agregado exitosamente');
        },
        error: (error) => {
          console.error('Error adding product:', error);
          alert('Error al agregar el producto: ' + error.message);
        }
      });
  }

  eliminarProducto(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => this.cargarProductos()),
        catchError(this.handleError)
      )
      .subscribe({
        next: () => {
          this.cargarProductos();
          alert('Producto eliminado exitosamente');
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          alert('Error al eliminar el producto: ' + error.message);
        }
      });
  }

  generarXML(): string {
    const productos = this.productosSubject.value;
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<Inventario>\n`;
    xml += `  <FechaGeneracion>${new Date().toISOString()}</FechaGeneracion>\n`;
    xml += `  <Productos>\n`;

    productos.forEach(producto => {
      xml += `    <Producto>\n`;
      xml += `      <Id>${producto.id}</Id>\n`;
      xml += `      <Nombre>${producto.nombre}</Nombre>\n`;
      xml += `      <Precio>${producto.precio}</Precio>\n`;
      xml += `      <Cantidad>${producto.cantidad}</Cantidad>\n`;
      xml += `      <Imagen>${producto.imagen}</Imagen>\n`;
      xml += `    </Producto>\n`; 
    });

    xml += `  </Productos>\n`;
    xml += `</Inventario>`;
    return xml;
  }

  descargarXML(): void {
    const xml = this.generarXML();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventario.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
