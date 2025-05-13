import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MascotaService } from '../../services/mascota.service';
import { MascotaModalComponent } from '../mascota-modal/mascota-modal.component';
import { Mascota, MascotaFormData } from '../../models/mascota';

@Component({
  selector: 'app-mascotas',
  standalone: true,
  imports: [CommonModule, MascotaModalComponent],
  template: `
    <div class="card">
      <div class="card-header">
        <h3>Mis Mascotas</h3>
        <button class="btn-add" (click)="showModal()">
          <i class="fas fa-plus"></i> Agregar Mascota
        </button>
      </div>
      
      <div class="mascota-cards">
        <div *ngFor="let mascota of mascotas" class="mascota-card">
          <div class="mascota-img" 
               [style.backgroundImage]="'url(' + getMascotaImage(mascota) + ')'">
          </div>
          <div class="mascota-info">
            <h4>{{mascota.nombre}}</h4>
            <p>{{mascota.raza}}, {{mascota.edad}} años</p>
            <p>Tamaño: {{mascota.tamano}}</p>
            <p *ngIf="mascota.notas">{{mascota.notas}}</p>
            <div class="mascota-actions">
              <button class="btn btn-outline" (click)="editarMascota(mascota)">Editar</button>
              <button class="btn btn-danger" (click)="eliminarMascota(mascota)" [disabled]="!mascota.id">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-mascota-modal
      [visible]="modalVisible"
      [mascota]="mascotaSeleccionada"
      (guardarMascota)="guardarMascota($event)"
      (cerrarModal)="modalVisible = false">
    </app-mascota-modal>
  `,
  styles: [`
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #eee;
    }

    .btn-add {
      padding: 8px 16px;
      font-size: 0.9rem;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-add:hover {
      background-color: #45a049;
    }

    .mascota-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      padding: 20px;
    }
    .mascota-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.2s;
    }
    .mascota-card:hover {
      transform: translateY(-4px);
    }
    .mascota-img {
      width: 100%;
      height: 220px;
      background-color: #f5f5f5;
      background-size: cover;
      background-position: center;
      border-bottom: 1px solid #eee;
    }
    .mascota-info {
      padding: 20px;
    }
    .mascota-info h4 {
      margin: 0 0 12px;
      color: #333;
      font-size: 1.25rem;
    }
    .mascota-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }
    .mascota-actions .btn {
      padding: 6px 12px;
      font-size: 0.9rem;
      min-width: 80px;
    }
    .btn {
      flex: 1;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-outline {
      background: transparent;
      border: 1px solid #4CAF50;
      color: #4CAF50;
    }
    .btn-outline:hover {
      background: #4CAF50;
      color: white;
    }
    .btn-danger {
      background: #f44336;
      color: white;
      border: none;
    }
    .btn-danger:hover {
      background: #d32f2f;
    }
  `]
})
export class MascotasComponent implements OnInit {
  mascotas: Mascota[] = [];
  modalVisible = false;
  mascotaSeleccionada?: Mascota;

  constructor(private mascotaService: MascotaService) {}

  ngOnInit() {
    this.cargarMascotas();
  }

  cargarMascotas() {
    this.mascotaService.getMascotas().subscribe(mascotas => {
      this.mascotas = mascotas;
    });
  }

  showModal() {
    this.mascotaSeleccionada = undefined;
    this.modalVisible = true;
  }

  editarMascota(mascota: Mascota) {
    this.mascotaSeleccionada = mascota;
    this.modalVisible = true;
  }

  guardarMascota(event: {id?: number, data: MascotaFormData}) {
    if (event.id) {
      // Edit existing pet
      this.mascotaService.editarMascota(event.id, event.data).subscribe({
        next: () => {
          this.modalVisible = false;
          this.cargarMascotas();
        },
        error: (error) => {
          console.error('Error al actualizar mascota:', error);
          alert('Error al actualizar la mascota');
        }
      });
    } else {
      // Add new pet
      this.mascotaService.agregarMascota(event.data).subscribe({
        next: () => {
          this.modalVisible = false;
          this.cargarMascotas();
        },
        error: (error) => {
          console.error('Error al guardar mascota:', error);
          alert('Error al guardar la mascota');
        }
      });
    }
  }

  getMascotaImage(mascota: Mascota): string {
    if (mascota.imagen_url) {
      return mascota.imagen_url;
    }
    return '/assets/default-pet.jpg';
  }

  eliminarMascota(mascota: Mascota) {
    if (!mascota.id) return;
    
    if (confirm(`¿Estás seguro de que deseas eliminar a ${mascota.nombre}?`)) {
      this.mascotaService.eliminarMascota(mascota.id).subscribe({
        next: () => {
          console.log('Mascota eliminada correctamente');
          this.cargarMascotas();
        },
        error: (error) => {
          console.error('Error al eliminar mascota:', error);
          alert('Error al eliminar la mascota');
        }
      });
    }
  }

  solicitarPaseo(mascota: Mascota) {
    // Navigate to paseo request with mascota id
    // Implement navigation logic
  }
}
