export type TamanoMascota = 'pequeño' | 'mediano' | 'grande';

export interface Mascota {
  id: number;
  nombre: string;
  raza: string;
  tamano: TamanoMascota;
  edad: number;
  notas?: string;
  usuario_id?: number;
  imagen?: string;
  imagen_url?: string;
}

export interface MascotaFormData extends Omit<Mascota, 'id' | 'imagen' | 'imagen_url'> {
  imagen?: File;
}

export interface MascotaResponse extends Mascota {
  mensaje?: string;
  error?: string;
}
