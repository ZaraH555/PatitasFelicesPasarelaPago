import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MascotaModalComponent } from '../mascota-modal/mascota-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MascotaModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  nombreUsuario = 'Usuario';
  mascotaModalVisible = false;

  mostrarModalMascota() {
    this.mascotaModalVisible = true;
  }
}
