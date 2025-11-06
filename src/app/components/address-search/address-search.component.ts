import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HereMapsService, Address } from '../../services/here-maps.service';
import { PolygonAnalysisService, PolygonAnalysisResult } from '../../services/polygon-analysis.service';

@Component({
  selector: 'app-address-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h3>Búsqueda de Direcciones</h3>
      
      <div class="form-group">
        <label for="addressInput">Ingrese una dirección:</label>
        <input 
          id="addressInput"
          type="text" 
          class="form-control" 
          [(ngModel)]="searchQuery"
          (keyup.enter)="searchAddress()"
          placeholder="Ej: Av. Reforma 123, CDMX"
          [disabled]="isLoading">
      </div>

      <div class="form-group">
        <button 
          class="btn btn-primary" 
          (click)="searchAddress()"
          [disabled]="!searchQuery.trim() || isLoading">
          <span *ngIf="isLoading">🔍 Buscando...</span>
          <span *ngIf="!isLoading">🔍 Buscar Dirección</span>
        </button>
        <button 
          class="btn btn-secondary" 
          (click)="clearResults()" 
          *ngIf="searchResults.length > 0 || analysisResult"
          style="margin-left: 10px;">
          Limpiar
        </button>
      </div>

      <div class="alert alert-info" *ngIf="isLoading">
        Geocodificando dirección y analizando polígonos...
      </div>

      <div class="alert alert-error" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>

      <div class="alert alert-warning" *ngIf="searchResults.length === 0 && searchAttempted && !isLoading && !errorMessage">
        No se encontraron resultados para: "{{ lastSearchQuery }}"
      </div>

      <div *ngIf="searchResults.length > 0" class="results-section">
        <h4>Resultados de Búsqueda:</h4>
        <div 
          *ngFor="let result of searchResults; let i = index"
          class="address-result"
          [class.selected]="selectedAddressIndex === i"
          (click)="selectAddress(result, i)"
          style="padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
          
          <div class="address-info">
            <strong>📍 {{ result.label }}</strong>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
              Coordenadas: {{ result.coordinates.lat.toFixed(6) }}, {{ result.coordinates.lng.toFixed(6) }}
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="analysisResult" class="analysis-section" style="margin-top: 20px;">
        <h4>Análisis de Polígonos:</h4>
        <div class="analysis-result" 
             [class.inside-polygon]="analysisResult.status === 'inside'"
             [class.outside-polygon]="analysisResult.status === 'outside'"
             [class.no-polygons]="analysisResult.status === 'no_polygons'"
             style="padding: 15px; border-radius: 4px; border: 2px solid;">
          
          <div *ngIf="analysisResult.status === 'inside'" class="inside-result">
            <div class="status-header">
              <span class="status-icon">✅</span>
              <strong>La dirección está DENTRO del polígono</strong>
            </div>
            <div class="polygon-info">
              <div><strong>Polígono:</strong> {{ analysisResult.result.name }}</div>
              <div><strong>ID:</strong> {{ analysisResult.result.id }}</div>
              <div><strong>Distancia:</strong> 0 km (dentro del área)</div>
            </div>
            <div *ngIf="analysisResult.allContaining && analysisResult.allContaining.length > 1" 
                 class="additional-info">
              <strong>También está dentro de:</strong>
              <div *ngFor="let polygon of analysisResult.allContaining.slice(1)" 
                   style="margin-left: 20px;">
                • {{ polygon.name }}
              </div>
            </div>
          </div>

          <div *ngIf="analysisResult.status === 'outside'" class="outside-result">
            <div class="status-header">
              <span class="status-icon">📍</span>
              <strong>La dirección está FUERA de todos los polígonos</strong>
            </div>
            <div class="polygon-info">
              <div><strong>Polígono más cercano:</strong> {{ analysisResult.result.name }}</div>
              <div><strong>ID:</strong> {{ analysisResult.result.id }}</div>
              <div><strong>Distancia:</strong> {{ analysisResult.distance }} km</div>
            </div>
            <div *ngIf="analysisResult.allDistances && analysisResult.allDistances.length > 1" 
                 class="additional-info">
              <strong>Otros polígonos cercanos:</strong>
              <div *ngFor="let item of analysisResult.allDistances.slice(1, 4)" 
                   style="margin-left: 20px;">
                • {{ item.polygon.name }}: {{ item.distance }} km
              </div>
            </div>
          </div>

          <div *ngIf="analysisResult.status === 'no_polygons'" class="no-polygons-result">
            <div class="status-header">
              <span class="status-icon">❌</span>
              <strong>No hay polígonos definidos en el sistema</strong>
            </div>
          </div>

          <div class="coordinates-info" style="margin-top: 10px; font-size: 12px; color: #666;">
            <strong>Coordenadas analizadas:</strong> 
            {{ analysisResult.coordinates.lat.toFixed(6) }}, {{ analysisResult.coordinates.lng.toFixed(6) }}
            <span *ngIf="analysisResult.address">
              <br><strong>Dirección:</strong> {{ analysisResult.address }}
            </span>
          </div>

          <div class="action-buttons" style="margin-top: 15px;">
            <button 
              class="btn btn-info btn-sm"
              (click)="showOnMap.emit(analysisResult)"
              style="font-size: 12px;">
              📍 Mostrar en Mapa
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inside-result {
      background-color: #d4edda;
      border-color: #28a745 !important;
    }
    .outside-result {
      background-color: #fff3cd;
      border-color: #ffc107 !important;
    }
    .no-polygons-result {
      background-color: #f8d7da;
      border-color: #dc3545 !important;
    }
    .status-header {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    .status-icon {
      font-size: 18px;
      margin-right: 8px;
    }
    .polygon-info div, .additional-info div {
      margin: 5px 0;
    }
    .coordinates-info {
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    .address-result:hover {
      background-color: #f8f9fa;
    }
    .address-result.selected {
      background-color: #e3f2fd;
      border-color: #2196f3;
    }
    .alert-error {
      color: #721c24;
      background-color: #f8d7da;
      border-color: #f5c6cb;
      padding: 0.75rem 1.25rem;
      margin-bottom: 1rem;
      border: 1px solid;
      border-radius: 0.25rem;
    }
    .alert-info {
      color: #0c5460;
      background-color: #d1ecf1;
      border-color: #bee5eb;
      padding: 0.75rem 1.25rem;
      margin-bottom: 1rem;
      border: 1px solid;
      border-radius: 0.25rem;
    }
    .alert-warning {
      color: #856404;
      background-color: #fff3cd;
      border-color: #ffeaa7;
      padding: 0.75rem 1.25rem;
      margin-bottom: 1rem;
      border: 1px solid;
      border-radius: 0.25rem;
    }
  `]
})
export class AddressSearchComponent implements OnInit {
  @Output() showOnMap = new EventEmitter<PolygonAnalysisResult>();

  searchQuery: string = '';
  searchResults: Address[] = [];
  analysisResult: PolygonAnalysisResult | null = null;
  selectedAddressIndex: number = -1;
  isLoading: boolean = false;
  errorMessage: string = '';
  searchAttempted: boolean = false;
  lastSearchQuery: string = '';

  constructor(
    private hereMapsService: HereMapsService,
    private polygonAnalysisService: PolygonAnalysisService
  ) {}

  ngOnInit(): void {
  }

  async searchAddress(): Promise<void> {
    if (!this.searchQuery.trim()) {
      this.errorMessage = 'Ingrese una dirección para buscar';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.searchResults = [];
    this.analysisResult = null;
    this.selectedAddressIndex = -1;
    this.searchAttempted = true;
    this.lastSearchQuery = this.searchQuery;

    try {
      const addresses = await this.hereMapsService.geocodeAddress(this.searchQuery);
      this.searchResults = addresses;

      if (addresses.length > 0) {
        this.selectAddress(addresses[0], 0);
      }

    } catch (error) {
      this.errorMessage = `Error buscando dirección: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      console.error('Error en búsqueda:', error);
    } finally {
      this.isLoading = false;
    }
  }

  selectAddress(address: Address, index: number): void {
    this.selectedAddressIndex = index;
    this.analyzeAddress(address);
  }

  private analyzeAddress(address: Address): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.polygonAnalysisService.analyzeAddressPoint(
      address.coordinates.lat,
      address.coordinates.lng,
      address.label
    ).subscribe({
      next: (result) => {
        this.analysisResult = result;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = `Error analizando dirección: ${error.error?.error || error.message || 'Error desconocido'}`;
        this.isLoading = false;
        console.error('Error análisis:', error);
      }
    });
  }

  clearResults(): void {
    this.searchResults = [];
    this.analysisResult = null;
    this.selectedAddressIndex = -1;
    this.errorMessage = '';
    this.searchAttempted = false;
    this.lastSearchQuery = '';
  }
}
