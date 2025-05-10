import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Mascota, MascotaFormData } from '../../models/mascota';

export interface MascotaForm extends Omit<Mascota, 'id' | 'imagen' | 'imagen_url'> {
  imagen?: File;
}

@Component({
  selector: 'app-mascota-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal" [class.show]="visible">
      <div class="modal-content">
        <div class="card">
          <div class="card-header">
            <h3>{{mascota?.id ? 'Editar' : 'Agregar'}} Mascota</h3>
            <button class="btn-close" (click)="cerrar()">✕</button>
          </div>
          <form (ngSubmit)="guardar()" #mascotaForm="ngForm" enctype="multipart/form-data">
            <div class="form-group">
              <label for="nombre">Nombre</label>
              <input type="text" id="nombre" name="nombre" class="form-control" 
                     [(ngModel)]="mascotaData.nombre" required>
            </div>
            <div class="form-group">
              <label for="raza">Raza</label>
              <input type="text" id="raza" name="raza" class="form-control" 
                     [(ngModel)]="mascotaData.raza" required>
            </div>
            <div class="form-group">
              <label for="tamano">Tamaño</label>
              <select id="tamano" name="tamano" class="form-control" 
                      [(ngModel)]="mascotaData.tamano" required>
                <option value="pequeno">Pequeño</option>
                <option value="mediano">Mediano</option>
                <option value="grande">Grande</option>
              </select>
            </div>
            <div class="form-group">
              <label for="imagen">Foto de la mascota</label>
              <input type="file" id="imagen" name="imagen" class="form-control"
                     (change)="onFileSelected($event)" accept="image/*">
            </div>
            <div class="form-group">
              <label for="edad">Edad (años)</label>
              <input type="number" id="edad" name="edad" class="form-control" 
                     [(ngModel)]="mascotaData.edad" required>
            </div>
            <div class="form-group">
              <label for="notas">Notas (opcional)</label>
              <textarea id="notas" name="notas" class="form-control" 
                        [(ngModel)]="mascotaData.notas"></textarea>
            </div>
            <div class="button-group">
              <button type="submit" class="btn btn-primary" [disabled]="!mascotaForm.form.valid">
                Guardar
              </button>
              <button type="button" class="btn btn-secondary" (click)="cerrar()">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
    }
    .modal.show { display: flex; }
    .modal-content { /* ...existing code... */ }
    .form-group { margin-bottom: 1rem; }
    .button-group { 
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }
  `]
})
export class MascotaModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() mascota?: Mascota;
  @Output() guardarMascota = new EventEmitter<{id?: number, data: MascotaFormData}>();
  @Output() cerrarModal = new EventEmitter<void>();

  mascotaData: MascotaFormData = {
    nombre: '',
    raza: '',
    tamano: 'mediano',
    edad: 0,
    notas: ''
  };

  selectedFile?: File;

  ngOnChanges() {
    if (this.mascota) {
      this.mascotaData = {
        nombre: this.mascota.nombre,
        raza: this.mascota.raza,
        tamano: this.mascota.tamano,
        edad: this.mascota.edad,
        notas: this.mascota.notas || ''
      };
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  guardar() {
    if (!this.mascotaData.nombre || !this.mascotaData.raza) {
      return;
    }

    this.guardarMascota.emit({
      id: this.mascota?.id,
      data: {
        ...this.mascotaData,
        imagen: this.selectedFile
      }
    });
    this.cerrar();
  }

  cerrar() {
    this.mascotaData = {
      nombre: '',
      raza: '',
      tamano: 'mediano',
      edad: 0,
      notas: ''
    };
    this.selectedFile = undefined;
    this.cerrarModal.emit();
  }
}
