import { Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/carrito.service';
import { RouterModule } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';



@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit {
  carrito: any[]=[];
  constructor(private carritoService:CarritoService, private cd: ChangeDetectorRef, private router: Router){}
    ngOnInit(){
      this.carrito = this.carritoService.obtenerCarrito();
    }
    eliminarProducto(index:number){
      this.carritoService.eliminarProducto(index);
      this.carrito = this.carritoService.obtenerCarrito();
      this.cd.detectChanges();
    }
    generarXML(): void {
      if (this.carrito.length === 0) {
        alert('El carrito está vacío');
        return;
      }
      this.carritoService.descargarXML();
    }
    irAProductos() {
      this.router.navigate(['/']);
    }
}

