import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaseosService } from '../../services/paseos.service';
import { Servicio } from '../../models/servicio';
import { Mascota } from '../../models/mascota';
import { HttpClientModule, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-paseo-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h3>Solicitar Paseo</h3>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label>Seleccionar Mascota</label>
          <select class="form-control" [(ngModel)]="mascotaSeleccionada">
            <option [ngValue]="null">Seleccione una mascota</option>
            <option *ngFor="let mascota of mascotas" [ngValue]="mascota">
              {{mascota.nombre}} - {{mascota.raza}}
            </option>
          </select>
        </div>

        <div class="servicios-grid">
          <div *ngFor="let servicio of servicios" class="servicio-card" 
               [class.selected]="servicioSeleccionado === servicio"
               (click)="seleccionarServicio(servicio)">
            <h4>{{servicio.nombre}}</h4>
            <p>{{servicio.duracion}} minutos</p>
            <p class="precio">{{servicio.precio | currency:'MXN'}}</p>
            <p class="descripcion">{{servicio.descripcion}}</p>
          </div>
        </div>

        <div class="button-group">
          <button class="btn btn-primary" 
                  [disabled]="!mascotaSeleccionada || !servicioSeleccionado"
                  (click)="procesarPago()">
            Continuar al Pago
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./paseo-solicitud.component.css']
})
export class PaseoSolicitudComponent implements OnInit {
  mascotas: Mascota[] = [];
  servicios: Servicio[] = [];
  mascotaSeleccionada: Mascota | null = null;
  servicioSeleccionado: Servicio | null = null;

  constructor(
    private paseosService: PaseosService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.paseosService.getMascotas().subscribe(mascotas => this.mascotas = mascotas);
    this.paseosService.getServicios().subscribe(servicios => this.servicios = servicios);
  }

  seleccionarServicio(servicio: Servicio) {
    this.servicioSeleccionado = servicio;
  }

  procesarPago() {
    if (!this.mascotaSeleccionada || !this.servicioSeleccionado) return;

    this.http.post<{url: string}>('http://localhost:3000/api/create-checkout-session', {
      servicio: this.servicioSeleccionado,
      mascotaId: this.mascotaSeleccionada.id,
      cantidad: 1
    }).subscribe({
      next: (response) => {
        if (response.url) {
          window.location.href = response.url;
        }
      },
      error: (error) => console.error('Error al crear sesión:', error)
    });
  }
}
