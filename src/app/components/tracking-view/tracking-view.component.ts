import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HereMapsService, LocationUpdate, Address } from '../../services/here-maps.service';
import { AddressService } from '../../services/address.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-tracking-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Rastreo en Tiempo Real</h2>
      
      <div class="form-group">
        <label for="driverSelect">Seleccionar conductor:</label>
        <select id="driverSelect" class="form-control" [(ngModel)]="selectedDriverId" (change)="onDriverChange()">
          <option value="">Selecciona un conductor</option>
          <option *ngFor="let driver of drivers" [value]="driver.id">{{ driver.name }}</option>
        </select>
      </div>

      <div class="alert alert-success" *ngIf="trackingActive">
        Rastreando ubicación de {{ getSelectedDriverName() }} - Actualización cada 5 segundos
      </div>

      <div class="alert alert-error" *ngIf="trackingError">
        {{ trackingError }}
      </div>

      <div #trackingMap class="map-container" style="height: 500px;"></div>

      <div class="card" *ngIf="currentLocation" style="margin-top: 20px;">
        <h3>Ubicación del Conductor</h3>
        <p><strong>Conductor:</strong> {{ getSelectedDriverName() }}</p>
        <p><strong>Coordenadas:</strong> {{ currentLocation.coordinates.lat }}, {{ currentLocation.coordinates.lng }}</p>
        <p><strong>Velocidad:</strong> {{ currentLocation.speed || 0 }} km/h</p>
        <p><strong>Última actualización:</strong> {{ currentLocation.timestamp | date:'medium' }}</p>
        <p *ngIf="currentAddress"><strong>Dirección actual:</strong> {{ currentAddress.label }}</p>
        <div *ngIf="currentRoute" style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
          <h4>Ruta Actual</h4>
          <p><strong>Distancia total:</strong> {{ currentRoute.totalDistance }} km</p>
          <p><strong>Tiempo estimado:</strong> {{ currentRoute.estimatedTime }} minutos</p>
          <p><strong>Entregas completadas:</strong> {{ currentRoute.completedDeliveries }} / {{ currentRoute.totalDeliveries }}</p>
        </div>
      </div>

      <div class="card" *ngIf="savedAddresses.length > 0">
        <h3>Puntos de Entrega</h3>
        <div *ngFor="let address of savedAddresses; let i = index" 
             class="delivery-point"
             [class.completed]="isAddressCompleted(address)"
             style="padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>{{ i + 1 }}. {{ address.label }}</strong>
              <div style="font-size: 12px; color: #666;">
                {{ address.coordinates.lat }}, {{ address.coordinates.lng }}
              </div>
            </div>
            <div>
              <span *ngIf="isAddressCompleted(address)" style="color: green; font-weight: bold;">✓ Completado</span>
              <span *ngIf="isCurrentDeliveryPoint(address)" style="color: orange; font-weight: bold;">📍 Ubicación Actual</span>
              <span *ngIf="getDistanceToAddress(address) !== null" style="font-size: 12px; color: #666;">
                Distancia: {{ getDistanceToAddress(address) }}m
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-top: 20px;">
        <button class="btn btn-primary" (click)="startTracking()" [disabled]="!selectedDriverId || trackingActive">
          Iniciar Rastreo
        </button>
        <button class="btn btn-primary" (click)="stopTracking()" [disabled]="!trackingActive" style="margin-left: 10px;">
          Detener Rastreo
        </button>
        <button class="btn btn-success" (click)="calculateAndShowRoute()" [disabled]="!currentLocation || savedAddresses.length === 0" style="margin-left: 10px; background-color: #28a745; border-color: #28a745;">
          Mostrar Ruta Optimizada ({{ savedAddresses.length }} direcciones)
        </button>
        <button class="btn btn-warning" (click)="clearRouteLines()" [disabled]="routeLines.length === 0" style="margin-left: 10px; background-color: #ffc107; border-color: #ffc107; color: black;">
          Ocultar Ruta ({{ routeLines.length }} líneas)
        </button>
      </div>
    </div>
  `,
  styles: [`
    .delivery-point.completed {
      background-color: #d4edda;
      border-color: #c3e6cb;
    }
  `]
})
export class TrackingViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('trackingMap', { static: true }) trackingMapContainer!: ElementRef;

  selectedDriverId: string = '';
  drivers = [
    { id: 'driver1', name: 'Juan Pérez' },
    { id: 'driver2', name: 'María González' },
    { id: 'driver3', name: 'Carlos López' }
  ];

  trackingActive: boolean = false;
  trackingError: string = '';
  currentLocation: LocationUpdate | null = null;
  currentAddress: Address | null = null;
  savedAddresses: Address[] = [];
  completedAddresses: Set<string> = new Set();
  currentRoute: any = null;

  private map: any;
  private ui: any;
  private behavior: any;
  private currentMarker: any;
  private routeMarkers: any[] = [];
  private startingPointMarker: any = null;
  routeLines: any[] = [];
  private optimizedRoute: any = null;
  private routeStartPoint: any = null;
  private trackingSubscription: Subscription | null = null;
  private locationSubscription: Subscription | null = null;

  constructor(
    private hereMapsService: HereMapsService,
    private addressService: AddressService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('TrackingViewComponent cargado con funcionalidad de rutas');
    this.addressService.addresses$.subscribe(addresses => {
      this.savedAddresses = addresses;
      console.log('Direcciones cargadas en tracking:', addresses.length);
      this.updateRouteMarkers();
    });

    this.locationSubscription = this.hereMapsService.currentLocation$.subscribe(location => {
      if (location) {
        this.currentLocation = location;
        this.updateCurrentLocationOnMap();
        this.checkProximityToDeliveryPoints();
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
    }, 500);
  }

  ngOnDestroy(): void {
    this.stopTracking();
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
  }

  private async initializeMap(): Promise<void> {
    if (!this.trackingMapContainer?.nativeElement) {
      this.trackingError = 'Container del mapa no disponible';
      setTimeout(() => this.initializeMap(), 1000);
      return;
    }

    const defaultCenter = { lat: 19.4326, lng: -99.1332 };
    try {
      const mapInstance = await this.hereMapsService.createMap(
        this.trackingMapContainer.nativeElement,
        defaultCenter,
        12
      );
      
      this.map = mapInstance.map;
      this.ui = mapInstance.ui;
      this.behavior = mapInstance.behavior;

      this.updateRouteMarkers();
      this.trackingError = '';
    } catch (error) {
      this.trackingError = `Error al inicializar el mapa: ${error}`;
      setTimeout(() => this.initializeMap(), 2000);
    }
  }

  onDriverChange(): void {
    if (this.trackingActive) {
      this.stopTracking();
    }
    this.currentLocation = null;
    this.currentAddress = null;
    this.trackingError = '';
    this.clearRouteLines();
  }

  startTracking(): void {
    if (!this.selectedDriverId) {
      this.trackingError = 'Selecciona un conductor primero';
      return;
    }

    this.trackingActive = true;
    this.trackingError = '';

    this.startSimulation();

    this.trackingSubscription = interval(5000).subscribe(() => {
      this.fetchLocationUpdate();
    });

    this.fetchLocationUpdate();
  }

  stopTracking(): void {
    this.trackingActive = false;
    this.stopSimulation();
    if (this.trackingSubscription) {
      this.trackingSubscription.unsubscribe();
      this.trackingSubscription = null;
    }
    this.clearRouteLines();
  }

  async calculateAndShowRoute(): Promise<void> {
    if (!this.map || !this.currentLocation || this.savedAddresses.length === 0) {
      this.trackingError = 'No se puede calcular la ruta. Asegúrate de que haya puntos de entrega y ubicación actual.';
      return;
    }

    this.trackingError = '';
    
    try {
      // Filtrar direcciones no completadas
      const pendingAddresses = this.savedAddresses.filter(addr => !this.isAddressCompleted(addr));
      
      if (pendingAddresses.length === 0) {
        this.trackingError = 'No hay entregas pendientes para mostrar ruta.';
        return;
      }

      // Usar la ubicación actual como punto de inicio para la ruta
      this.routeStartPoint = this.currentLocation.coordinates;
      const waypoints = pendingAddresses.map(addr => addr.coordinates);

      this.optimizedRoute = await this.hereMapsService.calculateOptimizedRoute(this.routeStartPoint, waypoints);
      
      if (this.optimizedRoute) {
        this.clearRouteLines();
        this.drawRouteLines();
        this.updateRouteMarkers(); // Actualizar marcadores después de mostrar la ruta
        this.trackingError = '';
      } else {
        this.trackingError = 'No se pudo calcular la ruta optimizada.';
      }
    } catch (error) {
      console.error('Error calculando ruta en tracking:', error);
      this.trackingError = 'Error al calcular la ruta optimizada.';
    }
  }

  private drawRouteLines(): void {
    if (!this.map || !this.optimizedRoute?.sections || !Array.isArray(this.optimizedRoute.sections)) {
      return;
    }

    this.optimizedRoute.sections.forEach((section: any, index: number) => {
      if (!section) return;
      
      try {
        let lineString = new (H as any).geo.LineString();
        
        if (section.type === 'manual' && section.departure && section.arrival) {
          const departure = section.departure;
          const arrival = section.arrival;
          
          if (this.hereMapsService.validateCoordinates(departure) && 
              this.hereMapsService.validateCoordinates(arrival)) {
            lineString.pushPoint(departure.lat, departure.lng);
            lineString.pushPoint(arrival.lat, arrival.lng);
          } else {
            return;
          }
        } else if (section.polyline && typeof section.polyline === 'string') {
          try {
            lineString = (H as any).geo.LineString.fromFlexiblePolyline(section.polyline);
          } catch (decodeError) {
            const routeCoordinates = this.hereMapsService.decodePolyline(section.polyline);
            
            if (!Array.isArray(routeCoordinates) || routeCoordinates.length === 0) {
              return;
            }
            
            let validPointsAdded = 0;
            routeCoordinates.forEach((coord: any) => {
              if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' && 
                  !isNaN(coord.lat) && !isNaN(coord.lng)) {
                lineString.pushPoint(coord.lat, coord.lng);
                validPointsAdded++;
              }
            });

            if (validPointsAdded < 2) {
              return;
            }
          }
        } else {
          return;
        }

        const routeLine = new (H as any).map.Polyline(lineString, {
          style: {
            strokeColor: index === this.optimizedRoute.sections.length - 1 ? '#ff6b35' : '#1e90ff',
            lineWidth: 4,
            lineDash: [0],
            lineCap: 'round'
          }
        });

        this.routeLines.push(routeLine);
        this.map.addObject(routeLine);
        
      } catch (error) {
        console.warn('Error al procesar sección de ruta en tracking:', error);
      }
    });
  }

  clearRouteLines(): void {
    if (!this.map) return;
    
    this.routeLines.forEach(line => {
      try {
        this.map.removeObject(line);
      } catch (error) {
        console.warn('Error removiendo línea de ruta:', error);
      }
    });
    this.routeLines = [];
    
    // También limpiar punto de inicio cuando se oculta la ruta
    if (this.startingPointMarker) {
      this.map.removeObject(this.startingPointMarker);
      this.startingPointMarker = null;
    }
    this.routeStartPoint = null;
  }

  private fetchLocationUpdate(): void {
    this.http.get<LocationUpdate>(`http://localhost:3000/api/location/${this.selectedDriverId}`)
      .subscribe({
        next: (location) => {
          this.currentLocation = location;
          this.hereMapsService.updateLocation(location);
          this.updateCurrentAddress(location.coordinates);
          this.updateCurrentRoute();
        },
        error: (error) => {
          this.trackingError = 'Error al obtener la ubicación del conductor';
        }
      });
  }

  private async updateCurrentAddress(coordinates: { lat: number; lng: number }): Promise<void> {
    try {
      const address = await this.hereMapsService.reverseGeocode(coordinates.lat, coordinates.lng);
      this.currentAddress = address;
    } catch (error) {
      this.currentAddress = null;
    }
  }

  private updateCurrentRoute(): void {
    if (!this.savedAddresses.length || !this.currentLocation) return;

    const totalDeliveries = this.savedAddresses.length;
    const completedDeliveries = this.getCompletedDeliveryCount();
    const totalDistance = this.calculateTotalRouteDistance();
    const estimatedTime = this.calculateEstimatedTime();

    this.currentRoute = {
      totalDistance: totalDistance,
      estimatedTime: estimatedTime,
      completedDeliveries: completedDeliveries,
      totalDeliveries: totalDeliveries,
      progress: Math.round((completedDeliveries / totalDeliveries) * 100)
    };
  }

  private getCompletedDeliveryCount(): number {
    return this.savedAddresses.filter(addr => this.isAddressCompleted(addr)).length;
  }

  private calculateTotalRouteDistance(): number {
    if (!this.savedAddresses.length || !this.currentLocation) return 0;
    
    let totalDistance = 0;
    let currentPoint = this.currentLocation.coordinates;

    for (const address of this.savedAddresses) {
      if (!this.isAddressCompleted(address)) {
        const distance = this.calculateDistance(currentPoint, address.coordinates);
        totalDistance += distance;
        currentPoint = address.coordinates;
      }
    }

    return Math.round(totalDistance / 1000 * 100) / 100;
  }

  private calculateEstimatedTime(): number {
    if (!this.savedAddresses.length) return 0;
    
    const remainingDeliveries = this.savedAddresses.filter(addr => !this.isAddressCompleted(addr)).length;
    const avgTimePerDelivery = 15;
    const travelTime = this.calculateTotalRouteDistance() / 50 * 60;
    
    return Math.round(remainingDeliveries * avgTimePerDelivery + travelTime);
  }

  private calculateDistance(coord1: any, coord2: any): number {
    const R = 6371000;
    const φ1 = coord1.lat * Math.PI / 180;
    const φ2 = coord2.lat * Math.PI / 180;
    const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
    const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private updateCurrentLocationOnMap(): void {
    if (!this.currentLocation || !this.map) return;

    // Limpiar marcador de ubicación actual anterior
    if (this.currentMarker) {
      this.map.removeObject(this.currentMarker);
    }

    // Crear marcador de ubicación actual del conductor (diferente al punto de inicio)
    const driverIcon = new (H as any).map.Icon(
      `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="blue" stroke="white" stroke-width="3"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
        <circle cx="16" cy="16" r="3" fill="blue"/>
      </svg>`,
      { size: { w: 32, h: 32 } }
    );

    this.currentMarker = new (H as any).map.Marker(this.currentLocation.coordinates, { icon: driverIcon });
    this.map.addObject(this.currentMarker);
    
    // Actualizar marcadores de ruta si es necesario
    this.updateRouteMarkers();
    
    // Centrar el mapa en la ubicación actual
    this.map.setCenter(this.currentLocation.coordinates);
    
    console.log('Ubicación del conductor actualizada:', this.currentLocation.coordinates);
  }

  private updateRouteMarkers(): void {
    if (!this.map) return;
    
    // Limpiar marcadores existentes
    this.routeMarkers.forEach(marker => {
      try {
        this.map.removeObject(marker);
      } catch (error) {
        console.warn('Error removiendo marcador:', error);
      }
    });
    this.routeMarkers = [];
    console.log('Marcadores limpiados, actualizando...');

    // Agregar marcador de inicio (ubicación del conductor)
    if (this.currentLocation) {
      const startIcon = new (H as any).map.Icon(
        'data:image/svg+xml;base64=' + btoa(`
          <svg width="36" height="36" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="15" fill="blue" stroke="white" stroke-width="4"/>
            <text x="18" y="23" text-anchor="middle" fill="white" font-size="16" font-weight="bold">S</text>
          </svg>
        `),
        { size: { w: 36, h: 36 } }
      );

      const startMarker = new (H as any).map.Marker(this.currentLocation.coordinates, { icon: startIcon });
      this.map.addObject(startMarker);
      this.routeMarkers.push(startMarker);
      console.log('Marcador de inicio agregado en:', this.currentLocation.coordinates);
    }

    // Agregar marcadores para cada dirección
    this.savedAddresses.forEach((address, index) => {
      const isCompleted = this.isAddressCompleted(address);
      const isPending = !isCompleted;
      
      const color = isCompleted ? '#28a745' : '#dc3545';
      const symbol = isCompleted ? 
        '<path d="M12 18 l3 3 l6-6" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' :
        `<text x="18" y="24" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${index + 1}</text>`;
      
      const icon = new (H as any).map.Icon(
        'data:image/svg+xml,' + encodeURIComponent(`
          <svg width="36" height="36" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="15" fill="${color}" stroke="white" stroke-width="4"/>
            ${symbol}
          </svg>
        `),
        { size: { w: 36, h: 36 } }
      );

      const marker = new (H as any).map.Marker(address.coordinates, { icon });
      this.map.addObject(marker);
      
      // Agregar evento de clic para mostrar información
      marker.addEventListener('tap', (evt: any) => {
        const bubble = new (H as any).ui.InfoBubble(
          `<div style="padding: 5px;">
            <strong>${isCompleted ? 'COMPLETADO' : 'PENDIENTE'}</strong><br>
            <strong>${index + 1}. ${address.label}</strong><br>
            <small>Lat: ${address.coordinates.lat.toFixed(4)}, Lng: ${address.coordinates.lng.toFixed(4)}</small>
            ${this.getDistanceToAddress(address) !== null ? 
              `<br><small>Distancia: ${this.getDistanceToAddress(address)}m</small>` : ''
            }
          </div>`,
          { lat: address.coordinates.lat, lng: address.coordinates.lng }
        );
        this.ui.addBubble(bubble);
      });
      
      this.routeMarkers.push(marker);
      console.log(`Marcador ${index + 1} agregado:`, {
        completed: isCompleted,
        coordinates: address.coordinates,
        label: address.label
      });
    });
    
    console.log(`Total marcadores agregados: ${this.routeMarkers.length}`);
  }

  private checkProximityToDeliveryPoints(): void {
    if (!this.currentLocation) return;

    this.savedAddresses.forEach(address => {
      const distance = this.calculateDistance(
        this.currentLocation!.coordinates,
        address.coordinates
      );

      if (distance < 100 && !this.completedAddresses.has(address.id)) {
        this.completedAddresses.add(address.id);
        this.updateRouteMarkers();
      }
    });
  }

  getSelectedDriverName(): string {
    const driver = this.drivers.find(d => d.id === this.selectedDriverId);
    return driver ? driver.name : '';
  }

  isAddressCompleted(address: Address): boolean {
    return this.completedAddresses.has(address.id);
  }

  isCurrentDeliveryPoint(address: Address): boolean {
    if (!this.currentLocation) return false;
    const distance = this.calculateDistance(this.currentLocation.coordinates, address.coordinates);
    return distance < 100;
  }

  getDistanceToAddress(address: Address): number | null {
    if (!this.currentLocation) return null;
    return Math.round(this.calculateDistance(this.currentLocation.coordinates, address.coordinates));
  }


  private startSimulation(): void {
    this.http.get(`http://localhost:3000/api/simulation/start/${this.selectedDriverId}`)
      .subscribe({
        next: (response: any) => {
          if (!response.success && response.message !== 'Simulación ya está activa') {
            this.trackingError = 'Error al iniciar la simulación';
          }
        },
        error: (error) => {
          this.trackingError = 'Error de conexión con el servidor';
        }
      });
  }

  private stopSimulation(): void {
    if (this.selectedDriverId) {
      this.http.get(`http://localhost:3000/api/simulation/stop/${this.selectedDriverId}`)
        .subscribe({
          error: (error) => {
          }
        });
    }
  }
}
