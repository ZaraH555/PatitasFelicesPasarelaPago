import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Mascota } from '../models/mascota';
import { Servicio } from '../models/servicio';
import { Paseo } from '../models/paseo';

@Injectable({
  providedIn: 'root'
})
export class PaseosService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  getMascotas(): Observable<Mascota[]> {
    return this.http.get<Mascota[]>(`${this.apiUrl}/mascotas`)
      .pipe(catchError(this.handleError));
  }

  getServicios(): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.apiUrl}/servicios`)
      .pipe(catchError(this.handleError));
  }

  getPaseos(): Observable<Paseo[]> {
    return this.http.get<Paseo[]>(`${this.apiUrl}/paseos`)
      .pipe(catchError(this.handleError));
  }

  addMascota(mascotaData: any): Observable<Mascota> {
    const formData = new FormData();
    formData.append('nombre', mascotaData.nombre);
    formData.append('raza', mascotaData.raza);
    formData.append('tamano', mascotaData.tamano);
    formData.append('edad', mascotaData.edad.toString());
    if (mascotaData.notas) {
      formData.append('notas', mascotaData.notas);
    }
    if (mascotaData.imagen) {
      formData.append('imagen', mascotaData.imagen);
    }
    
    return this.http.post<Mascota>(`${this.apiUrl}/mascotas`, formData);
  }

  addPaseo(paseo: Paseo): Observable<Paseo> {
    return this.http.post<Paseo>(`${this.apiUrl}/paseos`, paseo)
      .pipe(catchError(this.handleError));
  }

  updateMascota(id: number, mascota: Mascota): Observable<Mascota> {
    return this.http.put<Mascota>(`${this.apiUrl}/mascotas/${id}`, mascota)
      .pipe(catchError(this.handleError));
  }

  createPaseo(paseo: Partial<Paseo>): Observable<Paseo> {
    return this.http.post<Paseo>(`${this.apiUrl}/paseos`, paseo)
      .pipe(catchError(this.handleError));
  }

  createPaseos(paseos: Partial<Paseo>[]): Observable<Paseo[]> {
    return this.http.post<Paseo[]>(`${this.apiUrl}/paseos/bulk`, paseos)
      .pipe(catchError(this.handleError));
  }

  deleteMascota(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/mascotas/${id}`)
      .pipe(catchError(this.handleError));
  }
}
