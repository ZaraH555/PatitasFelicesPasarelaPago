import { Injectable } from '@angular/core';
import { Producto } from '../models/producto';
import { InventarioService } from '../services/inventario.service';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carrito: Producto[] = [];

  constructor(private inventarioService: InventarioService) {}

  agregarProducto(producto: Producto) {
    if (producto.cantidad > 0) {
      this.carrito.push({...producto});
      // Update inventory quantity
      const updatedProduct = {...producto, cantidad: producto.cantidad - 1};
      this.inventarioService.modificarProducto(producto.id, updatedProduct);
    } else {
      alert('No hay stock disponible');
    }
  }

  obtenerCarrito(): Producto[] {
    return this.carrito;
  }

  eliminarProducto(index: number): void {
    const producto = this.carrito[index];
    // Restore inventory quantity
    const updatedProduct = {...producto, cantidad: producto.cantidad + 1};
    this.inventarioService.modificarProducto(producto.id, updatedProduct);
    this.carrito.splice(index, 1);
  }

  generarXML(): string {
    if (this.carrito.length === 0) {
      throw new Error('El carrito está vacío');
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<Factura>\n`;
    xml += `  <Encabezado>\n`;
    xml += `    <Emisor>\n`;
    xml += `      <Nombre>TIENDA ZARA</Nombre>\n`;
    xml += `      <RFC>MT123456789</RFC>\n`;
    xml += `      <Direccion>Calle Nueva Escocia #123</Direccion>\n`;
    xml += `    </Emisor>\n`;
    xml += `    <Fecha>${new Date().toISOString().split('T')[0]}</Fecha>\n`;
    xml += `    <NoFactura>F001-${Math.floor(Math.random() * 10).toString().padStart(6, '0')}</NoFactura>\n`;
    xml += `  </Encabezado>\n`;
    xml += `  <Detalles>\n`;

    let totalSubtotal = 0;
    this.carrito.forEach(producto => {
      const subtotal = Number(producto.precio);
      totalSubtotal += subtotal;
      xml += `    <Item>\n`;
      xml += `      <Descripcion>${producto.nombre}</Descripcion>\n`;
      xml += `      <PrecioUnitario>${Number(producto.precio).toFixed(2)}</PrecioUnitario>\n`;
      xml += `      <Subtotal>${subtotal.toFixed(2)}</Subtotal>\n`;
      xml += `    </Item>\n`;
    });

    const impuestos = totalSubtotal * 0.16;
    const total = totalSubtotal + impuestos;

    xml += `  </Detalles>\n`;
    xml += `  <Totales>\n`;
    xml += `    <Subtotal>${totalSubtotal.toFixed(2)}</Subtotal>\n`;
    xml += `    <Impuestos>${impuestos.toFixed(2)}</Impuestos>\n`;
    xml += `    <Total>${total.toFixed(2)}</Total>\n`;
    xml += `  </Totales>\n`;
    xml += `</Factura>`;
    return xml;
  }

  descargarXML(): void {
    try {
      const xml = this.generarXML();
      const blob = new Blob([xml], { type: 'text/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura_${new Date().getTime()}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al generar XML:', error);
      alert(error instanceof Error ? error.message : 'Error al generar el XML');
    }
  }
}

