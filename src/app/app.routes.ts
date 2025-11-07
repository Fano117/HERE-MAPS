import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/reportes/entregas',
    pathMatch: 'full'
  },
  {
    path: 'reportes/entregas',
    loadComponent: () => import('./components/reportes-entregas/reportes-entregas.component').then(m => m.ReportesEntregasComponent)
  },
  {
    path: 'address',
    loadComponent: () => import('./components/address-management/address-management.component').then(m => m.AddressManagementComponent)
  },
  {
    path: 'tracking',
    loadComponent: () => import('./components/tracking-view/tracking-view.component').then(m => m.TrackingViewComponent)
  },
  {
    path: 'coverage',
    loadComponent: () => import('./components/coverage/coverage.component').then(m => m.CoverageComponent)
  }
];
