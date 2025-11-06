import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="container">
      <h1>HERE Maps - Gestión de Direcciones y Rastreo</h1>
      <nav style="margin-bottom: 20px;">
        <a routerLink="/address" class="btn btn-primary" style="margin-right: 10px;">Gestión de Direcciones</a>
        <a routerLink="/tracking" class="btn btn-primary" style="margin-right: 10px;">Rastreo en Tiempo Real</a>
        <a routerLink="/coverage" class="btn btn-primary">Cobertura</a>
      </nav>
      <router-outlet />
    </div>
  `
})
export class AppComponent {}
