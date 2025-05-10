export interface Paseo {
    id?: number;
    mascota_id: number;
    servicio_id: number;
    fecha_paseo: Date;
    hora_inicio: string;
    estado: 'pendiente' | 'completado' | 'cancelado';
    notas?: string;
}
