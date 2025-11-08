import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HereMapsService } from '../../services/here-maps.service';
import { PolygonAnalysisService } from '../../services/polygon-analysis.service';

declare var H: any;

interface CoveragePolygon {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number }[];
  created?: string;
  updated?: string;
}

@Component({
  selector: 'app-coverage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Análisis de Cobertura</h2>
      <p>Define y gestiona áreas de cobertura mediante polígonos en el mapa.</p>

      <div class="alert alert-info" style="margin-bottom: 20px;">
        <strong>Instrucciones:</strong>
        <ul style="margin: 10px 0 0 20px;">
          <li>Haz clic en "Crear Nuevo Polígono" para empezar a dibujar</li>
          <li>Haz clic en el mapa para agregar puntos del polígono</li>
          <li>Haz clic en "Finalizar Polígono" para guardar</li>
          <li>Haz clic en cualquier punto para verificar si está dentro de la cobertura</li>
        </ul>
      </div>

      <div class="form-group">
        <button class="btn btn-primary" (click)="startDrawing()" [disabled]="isDrawing">
          Crear Nuevo Polígono
        </button>
        <button class="btn btn-success" (click)="finishDrawing()" [disabled]="!isDrawing || drawingPoints.length < 3" style="margin-left: 10px;">
          Finalizar Polígono ({{ drawingPoints.length }} puntos)
        </button>
        <button class="btn btn-warning" (click)="cancelDrawing()" [disabled]="!isDrawing" style="margin-left: 10px; background-color: #ffc107; border-color: #ffc107; color: black;">
          Cancelar
        </button>
      </div>

      <div *ngIf="isDrawing" class="card" style="background-color: #fff3cd; border-color: #ffc107;">
        <h3>Creando Polígono</h3>
        <div class="form-group">
          <label for="polygonName">Nombre del área:</label>
          <input 
            type="text" 
            id="polygonName"
            class="form-control" 
            [(ngModel)]="newPolygonName"
            placeholder="Ej: Zona Centro, Zona Norte, etc.">
        </div>
        <p>Puntos agregados: {{ drawingPoints.length }}</p>
        <p style="color: #856404;">Haz clic en el mapa para agregar puntos. Necesitas al menos 3 puntos para crear un polígono.</p>
      </div>

      <div #coverageMap class="map-container" style="height: 500px; margin: 20px 0;"></div>

      <div class="alert alert-success" *ngIf="analysisResult && analysisResult.status === 'inside'" style="margin-top: 20px;">
        <strong>✅ Punto dentro de cobertura</strong>
        <p>El punto está dentro del área: <strong>{{ analysisResult.result?.name }}</strong></p>
        <p>Coordenadas: {{ analysisResult.coordinates.lat }}, {{ analysisResult.coordinates.lng }}</p>
      </div>

      <div class="alert alert-error" *ngIf="analysisResult && analysisResult.status === 'outside'" style="margin-top: 20px;">
        <strong>❌ Punto fuera de cobertura</strong>
        <p>El punto no está dentro de ninguna área de cobertura.</p>
        <p>Coordenadas: {{ analysisResult.coordinates.lat }}, {{ analysisResult.coordinates.lng }}</p>
        <p *ngIf="analysisResult.distance">Distancia al área más cercana: {{ analysisResult.distance.toFixed(2) }} metros</p>
      </div>

      <div class="alert" *ngIf="analysisResult && analysisResult.status === 'no_polygons'" style="background-color: #f8f9fa; border-color: #dee2e6; color: #495057; margin-top: 20px;">
        <strong>ℹ️ Sin áreas definidas</strong>
        <p>No hay polígonos de cobertura definidos. Crea uno para comenzar.</p>
      </div>

      <div class="card" *ngIf="polygons.length > 0" style="margin-top: 20px;">
        <h3>Áreas de Cobertura ({{ polygons.length }})</h3>
        <div *ngFor="let polygon of polygons; let i = index" class="polygon-item"
             style="padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>{{ polygon.name }}</strong>
              <div style="font-size: 12px; color: #666;">
                Puntos: {{ polygon.coordinates.length }}
              </div>
              <div style="font-size: 11px; color: #999;" *ngIf="polygon.created">
                Creado: {{ polygon.created | date:'short' }}
              </div>
            </div>
            <div>
              <button class="btn btn-primary" (click)="focusPolygon(polygon)" style="margin-right: 5px;">
                Ver en Mapa
              </button>
              <button class="btn btn-primary" (click)="deletePolygon(polygon.id)" 
                      style="background-color: #dc3545; border-color: #dc3545;">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-container {
      width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .polygon-item:hover {
      background-color: #f8f9fa;
    }
  `]
})
export class CoverageComponent implements OnInit, AfterViewInit {
  @ViewChild('coverageMap', { static: true }) mapContainer!: ElementRef;

  map: any;
  polygons: CoveragePolygon[] = [];
  
  isDrawing = false;
  drawingPoints: { lat: number; lng: number }[] = [];
  newPolygonName = '';
  drawingMarkers: any[] = [];
  drawingPolygon: any = null;
  
  polygonObjects: Map<string, any> = new Map();
  analysisResult: any = null;
  analysisMarker: any = null;

  private readonly API_BASE = 'http://localhost:3000/api';

  constructor(
    private hereMapsService: HereMapsService,
    private http: HttpClient,
    private polygonAnalysisService: PolygonAnalysisService
  ) {}

  async ngOnInit() {
    await this.loadPolygons();
  }

  async ngAfterViewInit() {
    await this.initializeMap();
    await this.renderPolygons();
  }

  async initializeMap() {
    try {
      // Centro de Ciudad de México
      const center = { lat: 19.4326, lng: -99.1332 };
      const { map } = await this.hereMapsService.createMap(
        this.mapContainer.nativeElement,
        center,
        11
      );
      this.map = map;

      // Agregar listener para clicks en el mapa
      this.map.addEventListener('tap', (evt: any) => {
        const coord = this.map.screenToGeo(
          evt.currentPointer.viewportX,
          evt.currentPointer.viewportY
        );
        this.onMapClick(coord.lat, coord.lng);
      });

    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
  }

  async loadPolygons() {
    try {
      const response = await this.http.get<CoveragePolygon[]>(`${this.API_BASE}/coverage`).toPromise();
      this.polygons = response || [];
    } catch (error) {
      console.error('Error al cargar polígonos:', error);
      this.polygons = [];
    }
  }

  async renderPolygons() {
    if (!this.map) return;

    // Limpiar polígonos existentes
    this.polygonObjects.forEach(polygon => {
      this.map.removeObject(polygon);
    });
    this.polygonObjects.clear();

    // Renderizar cada polígono
    this.polygons.forEach(polygon => {
      const polygonObject = this.createPolygonObject(polygon.coordinates);
      this.map.addObject(polygonObject);
      this.polygonObjects.set(polygon.id, polygonObject);
    });
  }

  createPolygonObject(coordinates: { lat: number; lng: number }[]) {
    const lineString = new H.geo.LineString();
    coordinates.forEach(coord => {
      lineString.pushPoint({ lat: coord.lat, lng: coord.lng });
    });
    // Cerrar el polígono conectando el último punto con el primero
    if (coordinates.length > 0) {
      lineString.pushPoint({ lat: coordinates[0].lat, lng: coordinates[0].lng });
    }

    const polygon = new H.map.Polygon(lineString, {
      style: {
        fillColor: 'rgba(0, 128, 255, 0.2)',
        strokeColor: 'rgba(0, 128, 255, 0.8)',
        lineWidth: 2
      }
    });

    return polygon;
  }

  startDrawing() {
    this.isDrawing = true;
    this.drawingPoints = [];
    this.newPolygonName = '';
    this.analysisResult = null;
    
    // Limpiar marker de análisis
    if (this.analysisMarker) {
      this.map.removeObject(this.analysisMarker);
      this.analysisMarker = null;
    }
  }

  onMapClick(lat: number, lng: number) {
    if (this.isDrawing) {
      // Agregar punto al polígono en construcción
      this.drawingPoints.push({ lat, lng });
      
      // Agregar marcador
      const marker = this.hereMapsService.addMarker(
        this.map,
        { lat, lng },
        {
          icon: new H.map.Icon(
            `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="8" fill="orange" stroke="white" stroke-width="2"/></svg>`
          )
        }
      );
      this.drawingMarkers.push(marker);
      
      // Actualizar polígono temporal
      this.updateDrawingPolygon();
    } else {
      // Analizar punto
      this.analyzePoint(lat, lng);
    }
  }

  updateDrawingPolygon() {
    // Remover polígono anterior
    if (this.drawingPolygon) {
      this.map.removeObject(this.drawingPolygon);
    }

    if (this.drawingPoints.length >= 2) {
      this.drawingPolygon = this.createPolygonObject(this.drawingPoints);
      this.map.addObject(this.drawingPolygon);
    }
  }

  async finishDrawing() {
    if (this.drawingPoints.length < 3) {
      alert('Necesitas al menos 3 puntos para crear un polígono.');
      return;
    }

    if (!this.newPolygonName.trim()) {
      alert('Por favor ingresa un nombre para el área.');
      return;
    }

    const newPolygon: CoveragePolygon = {
      id: `polygon_${Date.now()}`,
      name: this.newPolygonName.trim(),
      coordinates: this.drawingPoints
    };

    try {
      await this.http.post(`${this.API_BASE}/coverage`, newPolygon).toPromise();
      await this.loadPolygons();
      await this.renderPolygons();
      this.cancelDrawing();
      alert('Polígono creado exitosamente.');
    } catch (error) {
      console.error('Error al crear polígono:', error);
      alert('Error al crear el polígono.');
    }
  }

  cancelDrawing() {
    this.isDrawing = false;
    this.drawingPoints = [];
    this.newPolygonName = '';
    
    // Limpiar marcadores temporales
    this.drawingMarkers.forEach(marker => {
      this.map.removeObject(marker);
    });
    this.drawingMarkers = [];
    
    // Limpiar polígono temporal
    if (this.drawingPolygon) {
      this.map.removeObject(this.drawingPolygon);
      this.drawingPolygon = null;
    }
  }

  async deletePolygon(polygonId: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este polígono?')) {
      return;
    }

    try {
      await this.http.post(`${this.API_BASE}/coverage/delete/${polygonId}`, {}).toPromise();
      await this.loadPolygons();
      await this.renderPolygons();
      alert('Polígono eliminado exitosamente.');
    } catch (error) {
      console.error('Error al eliminar polígono:', error);
      alert('Error al eliminar el polígono.');
    }
  }

  focusPolygon(polygon: CoveragePolygon) {
    if (polygon.coordinates.length === 0) return;

    // Calcular el centro del polígono
    const sumLat = polygon.coordinates.reduce((sum, coord) => sum + coord.lat, 0);
    const sumLng = polygon.coordinates.reduce((sum, coord) => sum + coord.lng, 0);
    const center = {
      lat: sumLat / polygon.coordinates.length,
      lng: sumLng / polygon.coordinates.length
    };

    // Centrar y hacer zoom en el polígono
    this.map.setCenter(center);
    this.map.setZoom(13);
  }

  async analyzePoint(lat: number, lng: number) {
    try {
      this.analysisResult = null;
      
      // Limpiar marcador anterior
      if (this.analysisMarker) {
        this.map.removeObject(this.analysisMarker);
      }

      // Agregar nuevo marcador
      this.analysisMarker = this.hereMapsService.addMarker(
        this.map,
        { lat, lng },
        {
          icon: new H.map.Icon(
            `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="12" fill="purple" stroke="white" stroke-width="2"/></svg>`
          )
        }
      );

      // Analizar el punto
      this.polygonAnalysisService.analyzeMapPoint(lat, lng).subscribe({
        next: (result) => {
          this.analysisResult = result;
          console.log('Resultado del análisis:', result);
        },
        error: (error) => {
          console.error('Error al analizar punto:', error);
          alert('Error al analizar el punto.');
        }
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }
}
