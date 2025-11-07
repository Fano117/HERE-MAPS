import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coverage',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="coverage-container">
      <h2>Análisis de Cobertura</h2>
      <p>Esta vista permite analizar la cobertura de entregas por zona.</p>
      <p><em>Componente en desarrollo...</em></p>
    </div>
  `,
  styles: [`
    .coverage-container {
      padding: 20px;
    }
  `]
})
export class CoverageComponent {}
