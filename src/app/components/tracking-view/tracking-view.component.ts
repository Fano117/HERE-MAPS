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
        <h3>Ubicación Actual</h3>
        <p><strong>Conductor:</strong> {{ getSelectedDriverName() }}</p>
        <p><strong>Coordenadas:</strong> {{ currentLocation.coordinates.lat }}, {{ currentLocation.coordinates.lng }}</p>
        <p><strong>Velocidad:</strong> {{ currentLocation.speed || 0 }} km/h</p>
        <p><strong>Última actualización:</strong> {{ currentLocation.timestamp | date:'medium' }}</p>
        <p *ngIf="currentAddress"><strong>Dirección actual:</strong> {{ currentAddress.label }}</p>
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

  private map: any;
  private ui: any;
  private behavior: any;
  private currentMarker: any;
  private routeMarkers: any[] = [];
  private trackingSubscription: Subscription | null = null;
  private locationSubscription: Subscription | null = null;

  constructor(
    private hereMapsService: HereMapsService,
    private addressService: AddressService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.addressService.addresses$.subscribe(addresses => {
      this.savedAddresses = addresses;
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
  }

  private fetchLocationUpdate(): void {
    this.http.get<LocationUpdate>(`http://localhost:3000/api/location/${this.selectedDriverId}`)
      .subscribe({
        next: (location) => {
          this.hereMapsService.updateLocation(location);
          this.updateCurrentAddress(location.coordinates);
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

  private updateCurrentLocationOnMap(): void {
    if (!this.currentLocation || !this.map) return;

    if (this.currentMarker) {
      this.hereMapsService.removeMarkerSafely(this.map, this.currentMarker);
    }

    const icon = new H.map.Icon(
      'data:image/svg+xml;base64,' + btoa(`
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12" fill="blue" stroke="white" stroke-width="3"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      `),
      { size: { w: 32, h: 32 } }
    );

    this.currentMarker = this.hereMapsService.addMarker(
      this.map,
      this.currentLocation.coordinates,
      { icon }
    );

    this.map.setCenter(this.currentLocation.coordinates);
  }

  private updateRouteMarkers(): void {
    if (!this.map) return;
    
    this.routeMarkers.forEach(marker => {
      this.hereMapsService.removeMarkerSafely(this.map, marker);
    });
    this.routeMarkers = [];

    this.savedAddresses.forEach((address, index) => {
      const icon = new H.map.Icon(
        'data:image/svg+xml;base64=' + btoa(`
          <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="${this.isAddressCompleted(address) ? 'green' : 'red'}" stroke="white" stroke-width="3"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${index + 1}</text>
          </svg>
        `),
        { size: { w: 32, h: 32 } }
      );

      const marker = this.hereMapsService.addMarker(
        this.map,
        address.coordinates,
        { icon }
      );
      this.routeMarkers.push(marker);
    });
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

  private calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371e3;
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
