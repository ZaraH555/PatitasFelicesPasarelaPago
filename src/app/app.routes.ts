import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'mascotas', pathMatch: 'full' },
  { 
    path: 'mascotas', 
    loadComponent: () => import('./components/mascotas/mascotas.component').then(m => m.MascotasComponent)
  },
  { 
    path: 'paseos', 
    loadComponent: () => import('./components/paseo-solicitud/paseo-solicitud.component').then(m => m.PaseoSolicitudComponent)
  },
  { 
    path: 'facturas', 
    loadComponent: () => import('./components/facturas/facturas.component').then(m => m.FacturasComponent)
  },
  { 
    path: 'confirmacion', 
    loadComponent: () => import('./components/confirmacion/confirmacion.component').then(m => m.ConfirmacionComponent)
  },
  { 
    path: 'paseos/confirmacion', 
    redirectTo: 'confirmacion', 
    pathMatch: 'full' 
  }
];
