import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HereMapsService } from '../../services/here-maps.service';
import { TrackingService, LiveChofer } from '../../services/tracking.service';
import { WebsocketService } from '../../services/websocket.service';
import { environment } from '../../../environments/environment';

declare var H: any;

interface Entrega {
  ordenId: string;
  cliente: string;
  direccion: string;
  coordenadas: { lat: number; lng: number };
  estado: 'pendiente' | 'en_curso' | 'completada';
  eta?: string;
}

@Component({
  selector: 'app-reportes-entregas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reportes-container">
      <div class="header">
        <h2>Reportes de Entregas - Seguimiento en Tiempo Real</h2>
        
        <div class="controls">
          <label>
            Almacén:
            <select [(ngModel)]="selectedAlmacen" (change)="onAlmacenChange()">
              <option value="1">Almacén Central</option>
              <option value="2">Almacén Norte</option>
              <option value="3">Almacén Sur</option>
            </select>
          </label>

          <button (click)="startSimulation()" class="btn btn-success">
            Iniciar Simulación
          </button>

          <button (click)="stopAllSimulations()" class="btn btn-danger">
            Detener Simulación
          </button>
        </div>
      </div>

      <div class="main-content">
        <!-- Panel lateral con lista de choferes -->
        <div class="sidebar">
          <h3>Choferes Activos</h3>
          
          <div class="choferes-list">
            <div *ngFor="let chofer of choferes" 
                 class="chofer-card"
                 [class.selected]="selectedChofer?.choferId === chofer.choferId"
                 (click)="selectChofer(chofer)">
              <div class="chofer-header">
                <strong>{{ chofer.nombre }}</strong>
                <span class="status-badge" [class.active]="isChoferActive(chofer)">
                  {{ isChoferActive(chofer) ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              <div class="chofer-info">
                <div>Velocidad: {{ chofer.velocidad }} km/h</div>
                <div>Última actualización: {{ formatTime(chofer.ultimaActualizacion) }}</div>
                <div *ngIf="chofer.proximaEntrega">
                  Próxima entrega: {{ chofer.proximaEntrega.distancia }}m
                </div>
              </div>
            </div>
          </div>

          <!-- Panel de entregas pendientes -->
          <div *ngIf="selectedChofer" class="entregas-panel">
            <h4>Entregas del Chofer</h4>
            <div *ngFor="let entrega of entregas" class="entrega-item">
              <div class="entrega-header">
                <span class="orden-id">{{ entrega.ordenId }}</span>
                <span class="estado-badge" [class]="'estado-' + entrega.estado">
                  {{ entrega.estado }}
                </span>
              </div>
              <div class="entrega-info">
                <div><strong>Cliente:</strong> {{ entrega.cliente }}</div>
                <div><strong>Dirección:</strong> {{ entrega.direccion }}</div>
                <div *ngIf="entrega.eta"><strong>ETA:</strong> {{ formatTime(entrega.eta) }}</div>
              </div>
              <button (click)="enviarNotificacion(entrega)" class="btn btn-sm">
                Notificar Cliente
              </button>
            </div>
          </div>
        </div>

        <!-- Mapa -->
        <div class="map-container">
          <div #mapContainer class="map"></div>
          <div class="map-legend">
            <div class="legend-item">
              <span class="legend-marker chofer-marker"></span>
              Chofer en ruta
            </div>
            <div class="legend-item">
              <span class="legend-marker pending-marker"></span>
              Entrega pendiente
            </div>
            <div class="legend-item">
              <span class="legend-marker completed-marker"></span>
              Entrega completada
            </div>
            <div class="legend-item">
              <span class="legend-marker geofence"></span>
              Geocerca (200m)
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reportes-container {
      padding: 20px;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .header {
      margin-bottom: 20px;
    }

    .controls {
      display: flex;
      gap: 15px;
      align-items: center;
      margin-top: 10px;
    }

    .controls label {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .controls select {
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #ccc;
    }

    .main-content {
      display: flex;
      gap: 20px;
      flex: 1;
      overflow: hidden;
    }

    .sidebar {
      width: 350px;
      overflow-y: auto;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }

    .choferes-list {
      margin-bottom: 20px;
    }

    .chofer-card {
      background: white;
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 6px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .chofer-card:hover {
      border-color: #007bff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .chofer-card.selected {
      border-color: #0056b3;
      background: #e7f3ff;
    }

    .chofer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      background: #dc3545;
      color: white;
    }

    .status-badge.active {
      background: #28a745;
    }

    .chofer-info {
      font-size: 13px;
      color: #666;
    }

    .chofer-info > div {
      margin: 4px 0;
    }

    .entregas-panel {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #dee2e6;
    }

    .entrega-item {
      background: white;
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 4px solid #007bff;
    }

    .entrega-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .orden-id {
      font-weight: bold;
      color: #333;
    }

    .estado-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      color: white;
    }

    .estado-pendiente {
      background: #ffc107;
    }

    .estado-en_curso {
      background: #17a2b8;
    }

    .estado-completada {
      background: #28a745;
    }

    .entrega-info {
      font-size: 12px;
      margin-bottom: 10px;
    }

    .entrega-info > div {
      margin: 4px 0;
    }

    .map-container {
      flex: 1;
      position: relative;
      background: #e9ecef;
      border-radius: 8px;
      overflow: hidden;
    }

    .map {
      width: 100%;
      height: 100%;
    }

    .map-legend {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 8px 0;
      font-size: 13px;
    }

    .legend-marker {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: inline-block;
    }

    .chofer-marker {
      background: #007bff;
    }

    .pending-marker {
      background: #ffc107;
    }

    .completed-marker {
      background: #28a745;
    }

    .geofence {
      background: rgba(55, 85, 170, 0.3);
      border: 2px solid rgba(55, 85, 170, 0.6);
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-success:hover {
      background: #218838;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background: #c82333;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
      width: 100%;
      background: #007bff;
      color: white;
    }

    .btn-sm:hover {
      background: #0056b3;
    }
  `]
})
export class ReportesEntregasComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  selectedAlmacen: string = '1';
  choferes: LiveChofer[] = [];
  selectedChofer: LiveChofer | null = null;
  entregas: Entrega[] = [];

  private map: any;
  private choferMarkers = new Map<number, any>();
  private entregaMarkers = new Map<string, any>();
  private geofenceCircles = new Map<string, any>();
  private updateInterval: any;

  constructor(
    private hereMapsService: HereMapsService,
    private trackingService: TrackingService,
    private websocketService: WebsocketService,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    try {
      await this.initializeMap();
      this.loadChoferes();
      this.setupWebSocket();
      this.startPeriodicUpdate();
    } catch (error) {
      console.error('Error initializing component:', error);
    }
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.websocketService.disconnect();
  }

  private async initializeMap() {
    try {
      const mapData = await this.hereMapsService.createMap(
        this.mapContainer.nativeElement,
        { lat: 19.4326, lng: -99.1332 },
        12
      );
      this.map = mapData.map;
    } catch (error) {
      console.error('Error creating map:', error);
    }
  }

  private setupWebSocket() {
    this.websocketService.connect();
    
    this.websocketService.onChoferMovement((data) => {
      this.updateChoferMarker(data.choferId, data.lat, data.lng);
      this.updateChoferInList(data.choferId, data);
    });

    this.websocketService.subscribeToTracking(parseInt(this.selectedAlmacen));
  }

  private startPeriodicUpdate() {
    this.updateInterval = setInterval(() => {
      this.loadChoferes();
    }, 10000); // Actualizar cada 10 segundos
  }

  private loadChoferes() {
    this.trackingService.getLiveTracking(parseInt(this.selectedAlmacen))
      .subscribe({
        next: (response) => {
          this.choferes = response.choferes;
          this.updateMapMarkers();
        },
        error: (error) => {
          console.error('Error loading choferes:', error);
        }
      });
  }

  private updateMapMarkers() {
    // Actualizar marcadores de choferes
    this.choferes.forEach(chofer => {
      this.updateChoferMarker(
        chofer.choferId,
        chofer.ubicacionActual.lat,
        chofer.ubicacionActual.lng
      );
    });
  }

  private updateChoferMarker(choferId: number, lat: number, lng: number) {
    if (!this.map) return;

    let marker = this.choferMarkers.get(choferId);
    
    if (marker) {
      // Actualizar posición existente
      marker.setGeometry({ lat, lng });
    } else {
      // Crear nuevo marcador
      const icon = new H.map.Icon(`
        <div style="background: #007bff; width: 30px; height: 30px; border-radius: 50%; 
                    border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
          ${choferId}
        </div>
      `, {
        anchor: { x: 15, y: 15 }
      });

      marker = this.hereMapsService.addMarker(this.map, { lat, lng }, { icon });
      this.choferMarkers.set(choferId, marker);
    }
  }

  private updateChoferInList(choferId: number, data: any) {
    const chofer = this.choferes.find(c => c.choferId === choferId);
    if (chofer) {
      chofer.ubicacionActual = { lat: data.lat, lng: data.lng };
      chofer.velocidad = data.velocidad || 0;
      chofer.ultimaActualizacion = data.timestamp;
    }
  }

  selectChofer(chofer: LiveChofer) {
    this.selectedChofer = chofer;
    
    // Centrar mapa en chofer
    if (this.map) {
      this.map.setCenter(chofer.ubicacionActual);
      this.map.setZoom(14);
    }

    // Cargar entregas del chofer
    this.loadEntregasForChofer(chofer.choferId);
  }

  private loadEntregasForChofer(choferId: number) {
    // Entregas de ejemplo - en producción vendría del backend
    this.entregas = [
      {
        ordenId: `ORD-${choferId}-001`,
        cliente: 'Cliente A',
        direccion: 'Av. Insurgentes Sur 1234',
        coordenadas: { lat: 19.4284, lng: -99.1276 },
        estado: 'pendiente',
        eta: new Date(Date.now() + 15 * 60000).toISOString()
      },
      {
        ordenId: `ORD-${choferId}-002`,
        cliente: 'Cliente B',
        direccion: 'Reforma 456',
        coordenadas: { lat: 19.4240, lng: -99.1220 },
        estado: 'pendiente',
        eta: new Date(Date.now() + 30 * 60000).toISOString()
      }
    ];

    this.drawEntregasOnMap();
  }

  private drawEntregasOnMap() {
    // Limpiar marcadores anteriores
    this.entregaMarkers.forEach(marker => {
      this.hereMapsService.removeMarkerSafely(this.map, marker);
    });
    this.entregaMarkers.clear();

    this.geofenceCircles.forEach(circle => {
      this.map.removeObject(circle);
    });
    this.geofenceCircles.clear();

    // Dibujar nuevas entregas
    this.entregas.forEach((entrega, index) => {
      const color = entrega.estado === 'completada' ? '#28a745' : 
                    entrega.estado === 'en_curso' ? '#17a2b8' : '#ffc107';

      const icon = new H.map.Icon(`
        <div style="background: ${color}; width: 25px; height: 25px; border-radius: 50%; 
                    border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
          ${index + 1}
        </div>
      `, {
        anchor: { x: 12, y: 12 }
      });

      const marker = this.hereMapsService.addMarker(
        this.map,
        entrega.coordenadas,
        { icon }
      );
      this.entregaMarkers.set(entrega.ordenId, marker);

      // Agregar geocerca
      const circle = this.hereMapsService.createGeofence(
        this.map,
        entrega.coordenadas.lat,
        entrega.coordenadas.lng,
        environment.geofenceRadius
      );
      this.geofenceCircles.set(entrega.ordenId, circle);
    });
  }

  onAlmacenChange() {
    this.websocketService.unsubscribeFromTracking(parseInt(this.selectedAlmacen));
    this.loadChoferes();
    this.websocketService.subscribeToTracking(parseInt(this.selectedAlmacen));
  }

  async startSimulation() {
    try {
      // Iniciar simulación para 3 choferes
      for (let i = 1; i <= 3; i++) {
        await this.http.post(`${environment.backendUrl}/api/simulation/start`, {
          choferId: i,
          rutaId: i,
          velocidad: 60
        }).toPromise();
      }
      alert('Simulación iniciada para 3 choferes');
    } catch (error) {
      console.error('Error starting simulation:', error);
      alert('Error al iniciar simulación');
    }
  }

  async stopAllSimulations() {
    try {
      for (let i = 1; i <= 3; i++) {
        await this.http.post(`${environment.backendUrl}/api/simulation/stop/${i}`, {}).toPromise();
      }
      alert('Simulación detenida');
    } catch (error) {
      console.error('Error stopping simulation:', error);
    }
  }

  enviarNotificacion(entrega: Entrega) {
    if (!this.selectedChofer) return;

    this.http.post(`${environment.backendUrl}/api/notifications/proximity`, {
      ordenId: entrega.ordenId,
      choferId: this.selectedChofer.choferId,
      eta: entrega.eta,
      canal: 'sms'
    }).subscribe({
      next: () => {
        alert(`Notificación enviada para ${entrega.ordenId}`);
      },
      error: (error) => {
        console.error('Error sending notification:', error);
        alert('Error al enviar notificación');
      }
    });
  }

  isChoferActive(chofer: LiveChofer): boolean {
    if (!chofer.ultimaActualizacion) return false;
    const lastUpdate = new Date(chofer.ultimaActualizacion);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdate.getTime()) / 60000;
    return diffMinutes < 2; // Activo si actualizado en últimos 2 minutos
  }

  formatTime(timestamp: string | undefined): string {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }
}
