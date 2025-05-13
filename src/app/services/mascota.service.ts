import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { Mascota, MascotaFormData } from '../models/mascota';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MascotaService {
  private apiUrl = 'http://localhost:3000/api';
  private mascotas = new BehaviorSubject<Mascota[]>([]);

  constructor(private http: HttpClient) {
    this.cargarMascotas();
  }

  getMascotas(): Observable<Mascota[]> {
    return this.mascotas.asObservable();
  }

  cargarMascotas() {
    this.http.get<any[]>(`${this.apiUrl}/mascotas`).pipe(
      map(mascotas => mascotas.map(mascota => ({
        ...mascota,
        id: mascota.id,
        tamano: mascota.tamaño || mascota.tamano || 'mediano',
        imagen_url: mascota.imagen_url || 
          (mascota.imagen ? `${this.apiUrl}/uploads/mascotas/${mascota.imagen}` : '/assets/default-pet.jpg')
      } as Mascota)))
    ).subscribe({
      next: (mascotas) => {
        console.log('Mascotas cargadas:', mascotas);
        this.mascotas.next(mascotas);
      },
      error: (error) => console.error('Error al cargar mascotas:', error)
    });
  }

  agregarMascota(mascotaData: MascotaFormData): Observable<Mascota> {
    const formData = new FormData();
    Object.entries(mascotaData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'imagen' && value instanceof File) {
          formData.append('imagen', value);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.post<Mascota>(`${this.apiUrl}/mascotas`, formData).pipe(
      tap(mascota => {
        console.log('Mascota saved:', mascota);
        this.cargarMascotas();
      }),
      catchError(error => {
        console.error('Error saving mascota:', error);
        throw error;
      })
    );
  }

  editarMascota(id: number, mascotaData: MascotaFormData): Observable<Mascota> {
    const formData = new FormData();
    Object.entries(mascotaData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'imagen' && value instanceof File) {
          formData.append('imagen', value, value.name);
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    return this.http.put<Mascota>(`${this.apiUrl}/mascotas/${id}`, formData).pipe(
      tap(() => {
        console.log('Mascota updated successfully');
        this.cargarMascotas();
      }),
      catchError(error => {
        console.error('Error updating mascota:', error);
        throw error;
      })
    );
  }

  eliminarMascota(id: number): Observable<void> {
    if (!id) {
      throw new Error('ID de mascota no válido');
    }
    return this.http.delete<void>(`${this.apiUrl}/mascotas/${id}`).pipe(
      tap(() => this.cargarMascotas())
    );
  }

  getMascotaImage(mascota: Mascota): string {
    if (mascota.imagen_url) {
      return mascota.imagen_url.startsWith('http') ? 
        mascota.imagen_url : 
        `${this.apiUrl}/uploads/${mascota.imagen_url}`;
    }
    return '/assets/default-pet.jpg';
  }
}
