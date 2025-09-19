import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/address',
    pathMatch: 'full'
  },
  {
    path: 'address',
    loadComponent: () => import('./components/address-management/address-management.component').then(m => m.AddressManagementComponent)
  },
  {
    path: 'tracking',
    loadComponent: () => import('./components/tracking-view/tracking-view.component').then(m => m.TrackingViewComponent)
  }
];
