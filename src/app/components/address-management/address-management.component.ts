import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HereMapsService, Address } from '../../services/here-maps.service';
import { AddressService } from '../../services/address.service';

@Component({
  selector: 'app-address-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Gestión de Direcciones</h2>
      
      <div class="card" *ngIf="startingPoint" style="background-color: #e8f5e8; border-color: #4caf50;">
        <h3>Punto de Partida</h3>
        <p><strong>{{ startingPoint.label }}</strong></p>
        <p style="font-size: 12px; color: #666;">
          Coordenadas: {{ startingPoint.coordinates.lat }}, {{ startingPoint.coordinates.lng }}
        </p>
      </div>

      <div class="form-group">
        <label for="addressInput">Ingresa una dirección:</label>
        <input 
          type="text" 
          id="addressInput"
          class="form-control" 
          [(ngModel)]="addressInput"
          (keyup.enter)="validateAddress()"
          placeholder="Ej: PROL CUITLAHUAC, San Martín Centro, San Martín de las Pirámides, Estado de México, 55850, México">
        <button class="btn btn-primary" (click)="validateAddress()" style="margin-top: 10px;">
          Validar Dirección
        </button>
      </div>

      <div class="alert alert-error" *ngIf="validationError">
        {{ validationError }}
      </div>

      <div class="alert alert-success" *ngIf="validationSuccess">
        {{ validationSuccess }}
      </div>

      <div *ngIf="suggestions.length > 0" class="card">
        <h3>Sugerencias de direcciones:</h3>
        <div *ngFor="let suggestion of suggestions" class="suggestion-item" 
             style="padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 4px; cursor: pointer;"
             (click)="selectSuggestion(suggestion)">
          <strong>{{ suggestion.label }}</strong>
          <div style="font-size: 12px; color: #666;">
            Lat: {{ suggestion.coordinates.lat }}, Lng: {{ suggestion.coordinates.lng }}
          </div>
        </div>
      </div>

      <div #mapContainer class="map-container" style="margin: 20px 0;"></div>

      <div class="form-group" *ngIf="selectedAddress">
        <h3>Dirección seleccionada:</h3>
        <p><strong>{{ selectedAddress.label }}</strong></p>
        <p>Coordenadas: {{ selectedAddress.coordinates.lat }}, {{ selectedAddress.coordinates.lng }}</p>
        <button class="btn btn-success" (click)="saveAddress()">Guardar Dirección</button>
      </div>
    </div>

    <div class="card" *ngIf="savedAddresses.length > 0">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3>Direcciones de Entrega</h3>
        <button class="btn btn-primary" (click)="optimizeRoute()" [disabled]="!startingPoint">
          Calcular Ruta Óptima
        </button>
      </div>
      <div *ngFor="let address of savedAddresses; let i = index" class="saved-address"
           style="padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 4px;">
        <strong>{{ i + 1 }}. {{ address.label }}</strong>
        <div style="font-size: 12px; color: #666;">
          Coordenadas: {{ address.coordinates.lat }}, {{ address.coordinates.lng }}
        </div>
        <button class="btn btn-primary" (click)="showOnMap(address)" style="margin-top: 5px; margin-right: 5px;">
          Ver en Mapa
        </button>
        <button class="btn btn-primary" (click)="removeAddress(address.id)" 
                style="margin-top: 5px; background-color: #dc3545;">
          Eliminar
        </button>
      </div>
    </div>

    <div class="card" *ngIf="routeOptimized && routeSummary">
      <h3>
        Resumen de Ruta Optimizada 
        <span *ngIf="routeSummary.isOptimized" style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">
          API Optimizada
        </span>
        <span *ngIf="!routeSummary.isOptimized" style="background: #ffc107; color: black; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">
          Cálculo Manual
        </span>
      </h3>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
        <h4>Resumen General</h4>
        <p><strong>Distancia Total:</strong> {{ routeSummary.totalDistance }} km (incluye regreso)</p>
        <p><strong>Tiempo Estimado Total:</strong> {{ routeSummary.totalTime }} minutos</p>
        <p><strong>Número de Entregas:</strong> {{ routeSummary.pointDetails.length }}</p>
        <div style="margin-top: 10px; padding: 8px; background-color: #e8f5e8; border-radius: 4px; border-left: 4px solid #28a745;">
          <small><strong>Leyenda del mapa:</strong></small><br>
          <small>🔵 Líneas azules: Ruta hacia entregas</small><br>
          <small>🟠 Línea naranja punteada: Regreso al punto de partida</small>
        </div>
      </div>
      
      <h4>Detalle por Punto de Entrega</h4>
      <div *ngFor="let detail of routeSummary.pointDetails; let i = index" 
           style="padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 4px; background-color: #fff;">
        <strong>{{ i + 1 }}. {{ detail.address }}</strong>
        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
          <span style="color: #666; font-size: 12px;">
            Distancia desde punto anterior: {{ detail.distanceFromPrevious }} km
          </span>
          <span style="color: #666; font-size: 12px;">
            Tiempo estimado: {{ detail.timeFromPrevious }} min
          </span>
        </div>
      </div>
    </div>
  `
})
export class AddressManagementComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  addressInput: string = '';
  validationError: string = '';
  validationSuccess: string = '';
  suggestions: Address[] = [];
  selectedAddress: Address | null = null;
  savedAddresses: Address[] = [];
  
  private map: any;
  private ui: any;
  private behavior: any;
  private currentMarker: any;
  
  startingPoint: Address | null = null;
  defaultAddresses: any[] = [
    { address: 'CALLE YAUTEPEC 501', isCorrect: false },
    { address: 'AV INSURGENTES 123 COLONIA ROMA', isCorrect: false },
    { address: 'PROL CUITLAHUAC, San Martín Centro, San Martín de las Pirámides, Estado de México, 55850, México', isCorrect: true },
    { address: 'Av. Paseo de la Reforma 222, Juárez, Ciudad de México, 06600, México', isCorrect: true },
    { address: 'CALLE FALSA 999', isCorrect: false },
    { address: 'Eje Central Lázaro Cárdenas 13, Centro Histórico, Ciudad de México, 06000, México', isCorrect: true }
  ];
  routeOptimized: boolean = false;
  routeSummary: any = null;
  optimizedRoute: any = null;
  routeLines: any[] = [];

  constructor(
    private hereMapsService: HereMapsService,
    private addressService: AddressService
  ) {}

  ngOnInit(): void {
    this.addressService.clearAllAddresses();
    this.loadDefaultAddresses();
    this.addressService.addresses$.subscribe(addresses => {
      this.savedAddresses = addresses;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
    }, 500);
  }

  loadDefaultAddresses(): void {
    const validAddresses = [
      {
        id: 'default-1',
        label: 'Av. Paseo de la Reforma 222, Juárez, Ciudad de México, 06600, México',
        coordinates: { lat: 19.4326, lng: -99.1332 }
      },
      {
        id: 'default-2', 
        label: 'Eje Central Lázaro Cárdenas 13, Centro Histórico, Ciudad de México, 06000, México',
        coordinates: { lat: 19.4284, lng: -99.1276 }
      },
      {
        id: 'default-3',
        label: 'Polanco V Sección, Miguel Hidalgo, Ciudad de México, 11560, México', 
        coordinates: { lat: 19.4363, lng: -99.1922 }
      },
      {
        id: 'default-4',
        label: 'Roma Norte, Ciudad de México, 06700, México',
        coordinates: { lat: 19.4150, lng: -99.1620 }
      },
      {
        id: 'default-5',
        label: 'Condesa, Ciudad de México, 06140, México',
        coordinates: { lat: 19.4080, lng: -99.1712 }
      }
    ];
    
    validAddresses.forEach(address => {
      this.addressService.addAddress(address);
    });
    
    setTimeout(() => {
      this.demonstrateProblematicAddresses();
    }, 2000);
    
    this.setDefaultStartingPoint();
  }

  demonstrateProblematicAddresses(): void {
    const problematicAddresses = ['CALLE YAUTEPEC 501', 'AV INSURGENTES 123 COLONIA ROMA'];
    
    problematicAddresses.forEach((address, index) => {
      setTimeout(() => {
        this.addressInput = address;
        this.validateAddress(true);
      }, index * 3000);
    });
  }

  async setDefaultStartingPoint(): Promise<void> {
    const startingAddress = 'Ciudad Universitaria, Ciudad de México, 04510, México';
    this.startingPoint = {
      id: 'starting-point',
      label: startingAddress,
      coordinates: { lat: 19.3263, lng: -99.1757 }
    };
  }

  private async initializeMap(): Promise<void> {
    if (!this.mapContainer?.nativeElement) {
      this.validationError = 'Container del mapa no disponible';
      setTimeout(() => this.initializeMap(), 1000);
      return;
    }

    const defaultCenter = { lat: 19.4326, lng: -99.1332 };
    try {
      const mapInstance = await this.hereMapsService.createMap(
        this.mapContainer.nativeElement,
        defaultCenter,
        10
      );
      
      this.map = mapInstance.map;
      this.ui = mapInstance.ui;
      this.behavior = mapInstance.behavior;

      this.map.addEventListener('tap', (evt: any) => {
        const coord = this.map.screenToGeo(
          evt.currentPointer.viewportX,
          evt.currentPointer.viewportY
        );
        this.onMapClick(coord.lat, coord.lng);
      });
      
      this.validationError = '';
    } catch (error) {
      this.validationError = `Error al inicializar el mapa: ${error}`;
      setTimeout(() => this.initializeMap(), 2000);
    }
  }

  async validateAddress(showMessages: boolean = true): Promise<void> {
    if (!this.addressInput.trim()) {
      if (showMessages) this.validationError = 'Por favor ingresa una dirección';
      return;
    }

    try {
      if (showMessages) {
        this.validationError = '';
        this.validationSuccess = '';
      }
      
      const validation = await this.hereMapsService.validateAddress(this.addressInput);
      
      if (validation.isValid) {
        if (showMessages) this.validationSuccess = 'Dirección válida encontrada';
        this.selectedAddress = validation.suggestions[0];
        this.suggestions = validation.suggestions;
        this.updateMapWithAddress(this.selectedAddress);
        if (!showMessages) this.saveAddress();
      } else if (validation.suggestions.length > 0) {
        if (showMessages) this.validationError = 'Dirección no exacta. Por favor selecciona una de las sugerencias:';
        this.suggestions = validation.suggestions;
        this.selectedAddress = null;
      } else {
        if (showMessages) this.validationError = 'No se encontraron direcciones similares. Intenta con una dirección diferente.';
        this.suggestions = [];
        this.selectedAddress = null;
      }
    } catch (error) {
      if (showMessages) this.validationError = 'Error al validar la dirección. Intenta nuevamente.';
      this.suggestions = [];
      this.selectedAddress = null;
    }
  }

  selectSuggestion(suggestion: Address): void {
    this.selectedAddress = suggestion;
    this.addressInput = suggestion.label;
    this.validationSuccess = 'Dirección seleccionada correctamente';
    this.validationError = '';
    this.updateMapWithAddress(suggestion);
  }

  private updateMapWithAddress(address: Address): void {
    if (!this.map) return;
    
    if (this.currentMarker) {
      this.hereMapsService.removeMarkerSafely(this.map, this.currentMarker);
    }

    this.map.setCenter({ lat: address.coordinates.lat, lng: address.coordinates.lng });
    this.map.setZoom(15);

    this.currentMarker = this.hereMapsService.addMarker(
      this.map,
      address.coordinates
    );
  }

  private async onMapClick(lat: number, lng: number): Promise<void> {
    if (!this.map) return;
    
    try {
      const address = await this.hereMapsService.reverseGeocode(lat, lng);
      this.selectedAddress = address;
      this.addressInput = address.label;
      this.validationSuccess = 'Dirección seleccionada desde el mapa';
      this.validationError = '';
      this.suggestions = [address];

      if (this.currentMarker) {
        this.hereMapsService.removeMarkerSafely(this.map, this.currentMarker);
      }

      this.currentMarker = this.hereMapsService.addMarker(
        this.map,
        { lat, lng }
      );
    } catch (error) {
      this.validationError = 'No se pudo obtener la dirección para esta ubicación';
    }
  }

  saveAddress(): void {
    if (this.selectedAddress) {
      this.addressService.addAddress(this.selectedAddress);
      this.validationSuccess = 'Dirección guardada correctamente';
      this.addressInput = '';
      this.selectedAddress = null;
      this.suggestions = [];
      
      if (this.currentMarker && this.map) {
        this.hereMapsService.removeMarkerSafely(this.map, this.currentMarker);
      }
    }
  }

  showOnMap(address: Address): void {
    this.selectedAddress = address;
    this.updateMapWithAddress(address);
  }

  removeAddress(addressId: string): void {
    this.addressService.removeAddress(addressId);
  }

  async optimizeRoute(): Promise<void> {
    if (!this.startingPoint || this.savedAddresses.length === 0) {
      this.validationError = 'Necesitas un punto de partida y al menos una dirección de entrega';
      return;
    }

    this.validationError = '';
    this.validationSuccess = 'Calculando ruta optimizada...';
    
    try {
      await this.calculateOptimizedRouteWithAPI();
    } catch (error) {
      console.warn('API Route calculation failed, using manual calculation:', error);
      this.validationError = '';
      this.validationSuccess = 'Usando cálculo manual (API no disponible)';
      this.calculateOptimizedRoute();
    }
  }

  private async calculateOptimizedRouteWithAPI(): Promise<void> {
    if (!this.startingPoint) return;

    this.validationSuccess = 'Calculando la mejor ruta...';
    
    // Filtrar solo coordenadas válidas dentro del área metropolitana de Ciudad de México
    const validWaypoints = this.savedAddresses
      .filter(addr => this.isValidCDMXCoordinate(addr.coordinates))
      .map(addr => addr.coordinates);
    
    if (validWaypoints.length === 0) {
      throw new Error('No hay direcciones válidas para calcular la ruta');
    }
    
    console.log('Valid waypoints:', validWaypoints);
    
    try {
      this.optimizedRoute = await this.hereMapsService.calculateOptimizedRoute(
        this.startingPoint.coordinates,
        validWaypoints
      );
      
      const summary = this.optimizedRoute.summary || 
        this.optimizedRoute.sections.reduce((acc: any, section: any) => {
          acc.length += section.summary.length;
          acc.duration += section.summary.duration;
          return acc;
        }, { length: 0, duration: 0 });

      this.routeSummary = {
        totalDistance: Math.round((summary.length || summary.distance) / 1000 * 100) / 100,
        totalTime: Math.round((summary.duration || summary.time) / 60),
        pointDetails: this.generateRouteDetails(),
        isOptimized: true
      };

      this.routeOptimized = true;
      this.validationSuccess = 'Ruta optimizada calculada exitosamente';
      
      await this.showOptimizedRouteOnMap();
      
    } catch (error) {
      throw error;
    }
  }

  private generateRouteDetails(): any[] {
    if (!this.optimizedRoute || !this.optimizedRoute.sections) return [];
    
    const validAddresses = this.savedAddresses.filter(addr => this.isValidCDMXCoordinate(addr.coordinates));
    
    return validAddresses.map((address, index) => {
      const section = this.optimizedRoute.sections[index];
      let distance = 0;
      let duration = 0;
      
      if (section) {
        distance = section.summary.length || 0;
        duration = section.summary.duration || 0;
      }
      
      return {
        address: address.label,
        distanceFromPrevious: Math.round(distance / 1000 * 100) / 100,
        timeFromPrevious: Math.round(duration / 60),
        coordinates: address.coordinates
      };
    });
  }

  private calculateOptimizedRoute(): void {
    if (!this.startingPoint) return;
    
    // Filtrar solo direcciones válidas para cálculo manual también
    const validSavedAddresses = this.savedAddresses.filter(addr => this.isValidCDMXCoordinate(addr.coordinates));
    
    if (validSavedAddresses.length === 0) {
      this.validationError = 'No hay direcciones válidas para calcular la ruta';
      return;
    }
    
    const allPoints = [this.startingPoint, ...validSavedAddresses];
    const distances: number[] = [];
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 0; i < allPoints.length - 1; i++) {
      const currentPoint = allPoints[i];
      const nextPoint = allPoints[i + 1];
      if (currentPoint && nextPoint) {
        const distance = this.calculateDistance(currentPoint.coordinates, nextPoint.coordinates);
        distances.push(distance);
        totalDistance += distance;
        totalTime += Math.ceil(distance / 1000 * 2.5 + 10);
      }
    }
    
    const returnDistance = this.calculateDistance(
      validSavedAddresses[validSavedAddresses.length - 1]?.coordinates || this.startingPoint.coordinates,
      this.startingPoint.coordinates
    );
    totalDistance += returnDistance;
    totalTime += Math.ceil(returnDistance / 1000 * 2.5 + 10);

    this.routeSummary = {
      totalDistance: Math.round(totalDistance / 1000 * 100) / 100,
      totalTime: totalTime,
      isOptimized: false,
      pointDetails: validSavedAddresses.map((address, index) => ({
        address: address.label,
        distanceFromPrevious: distances[index] ? Math.round(distances[index] / 1000 * 100) / 100 : 0,
        timeFromPrevious: distances[index] ? Math.ceil(distances[index] / 1000 * 2.5 + 10) : 0,
        coordinates: address.coordinates
      }))
    };

    this.optimizedRoute = {
      sections: this.createManualRouteSections(validSavedAddresses),
      summary: { length: totalDistance, duration: totalTime * 60 }
    };
    
    this.routeOptimized = true;
    this.validationSuccess = 'Ruta calculada exitosamente (método manual)';
    this.showOptimizedRouteOnMap();
  }

  private createManualRouteSections(validSavedAddresses: any[]): any[] {
    if (!this.startingPoint) return [];
    
    const sections = [];
    let currentPoint = this.startingPoint;
    
    for (const address of validSavedAddresses) {
      sections.push({
        type: 'manual',
        departure: currentPoint.coordinates,
        arrival: address.coordinates,
        summary: {
          length: this.calculateDistance(currentPoint.coordinates, address.coordinates),
          duration: Math.ceil(this.calculateDistance(currentPoint.coordinates, address.coordinates) / 1000 * 2.5 + 10) * 60
        }
      });
      currentPoint = address;
    }
    
    sections.push({
      type: 'manual',
      departure: currentPoint.coordinates,
      arrival: this.startingPoint.coordinates,
      summary: {
        length: this.calculateDistance(currentPoint.coordinates, this.startingPoint.coordinates),
        duration: Math.ceil(this.calculateDistance(currentPoint.coordinates, this.startingPoint.coordinates) / 1000 * 2.5 + 10) * 60
      }
    });
    
    return sections;
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

  private async showOptimizedRouteOnMap(): Promise<void> {
    if (!this.map) return;

    this.clearMapMarkers();
    this.clearRouteLines();
    
    if (this.startingPoint) {
      const startMarker = new (H as any).map.Marker(this.startingPoint.coordinates, {
        icon: new (H as any).map.Icon(
          `<svg width="24" height="32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="green" stroke="white" stroke-width="2"/>
            <text x="12" y="16" font-family="Arial" font-size="12" text-anchor="middle" fill="white">S</text>
          </svg>`,
          { size: { w: 24, h: 32 } }
        )
      });
      this.map.addObject(startMarker);
    }

    // Solo mostrar direcciones válidas
    const validAddressesForMarkers = this.savedAddresses.filter(addr => this.isValidCDMXCoordinate(addr.coordinates));
    
    validAddressesForMarkers.forEach((address, index) => {
      const marker = new (H as any).map.Marker(address.coordinates, {
        icon: new (H as any).map.Icon(
          `<svg width="24" height="32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="red" stroke="white" stroke-width="2"/>
            <text x="12" y="16" font-family="Arial" font-size="12" text-anchor="middle" fill="white">${index + 1}</text>
          </svg>`,
          { size: { w: 24, h: 32 } }
        )
      });
      this.map.addObject(marker);
    });

    if (this.optimizedRoute && this.optimizedRoute.sections) {
      console.log('Dibujando líneas de ruta con secciones:', this.optimizedRoute.sections.length);
      console.log('Primera sección:', this.optimizedRoute.sections[0]);
      this.drawRouteLines();
    } else {
      console.log('No hay optimizedRoute.sections para dibujar:', this.optimizedRoute);
    }

    const validAddressesForBounds = this.savedAddresses.filter(addr => this.isValidCDMXCoordinate(addr.coordinates));
    const allCoords = [this.startingPoint?.coordinates, ...validAddressesForBounds.map(a => a.coordinates)].filter(Boolean);
    if (allCoords.length > 0) {
      this.adjustMapViewToShowAllPoints(allCoords);
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
          console.log(`Procesando polyline para sección ${index}:`, section.polyline.substring(0, 50) + '...');
          
          // Usar el decodificador nativo de HERE Maps para Flexible Polylines
          try {
            console.log('Intentando decodificar con fromFlexiblePolyline...');
            lineString = (H as any).geo.LineString.fromFlexiblePolyline(section.polyline);
            console.log('Polyline decodificado exitosamente para sección', index);
          } catch (decodeError) {
            console.error('Error decodificando flexible polyline para sección', index, ':', decodeError);
            console.log('Intentando con decodificador manual...');
            
            // Fallback al decodificador manual
            const routeCoordinates = this.hereMapsService.decodePolyline(section.polyline);
            
            if (!Array.isArray(routeCoordinates) || routeCoordinates.length === 0) {
              console.error('Decodificador manual también falló para sección', index);
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

            console.log(`Sección ${index} (fallback): ${validPointsAdded} puntos agregados al LineString`);
            
            if (validPointsAdded < 2) {
              console.error('Insuficientes puntos válidos en fallback para sección', index);
              return;
            }
          }
        } else {
          return;
        }

        console.log(`Creando polyline para sección ${index}...`);
        const routeLine = new (H as any).map.Polyline(lineString, {
          style: {
            strokeColor: index === this.optimizedRoute.sections.length - 1 ? '#ff6b35' : '#1e90ff',
            lineWidth: 4,
            lineDash: index === this.optimizedRoute.sections.length - 1 ? [5, 5] : [0],
            lineCap: 'round'
          }
        });

        console.log(`Agregando línea de ruta al mapa para sección ${index}`);
        this.routeLines.push(routeLine);
        this.map.addObject(routeLine);
        console.log(`Línea agregada exitosamente. Total de líneas en el mapa:`, this.routeLines.length);
        
      } catch (error) {
        console.warn('Error al procesar sección de ruta:', error);
      }
    });
  }

  private clearRouteLines(): void {
    if (!this.map) return;
    
    this.routeLines.forEach(line => {
      try {
        this.map.removeObject(line);
      } catch (error) {
        // Ignorar errores
      }
    });
    this.routeLines = [];
  }

  private adjustMapViewToShowAllPoints(coords: any[]): void {
    if (coords.length === 0 || !this.map) return;
    
    if (coords.length === 1) {
      this.map.setCenter(coords[0]);
      this.map.setZoom(15);
      return;
    }

    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    this.map.setCenter({ lat: centerLat, lng: centerLng });
    
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);
    const maxRange = Math.max(latRange, lngRange);
    
    let zoom = 15;
    if (maxRange > 0.1) zoom = 10;
    else if (maxRange > 0.05) zoom = 12;
    else if (maxRange > 0.01) zoom = 14;
    
    this.map.setZoom(zoom);
  }

  private clearMapMarkers(): void {
    if (!this.map) return;
    
    this.map.removeObjects(this.map.getObjects());
    this.clearRouteLines();
  }

  private isValidCDMXCoordinate(coord: {lat: number, lng: number}): boolean {
    // Área metropolitana de Ciudad de México aproximada
    const bounds = {
      minLat: 19.0,   // Sur de CDMX
      maxLat: 19.8,   // Norte de CDMX
      minLng: -99.5,  // Oeste de CDMX
      maxLng: -98.8   // Este de CDMX
    };
    
    return coord.lat >= bounds.minLat && coord.lat <= bounds.maxLat &&
           coord.lng >= bounds.minLng && coord.lng <= bounds.maxLng &&
           !isNaN(coord.lat) && !isNaN(coord.lng);
  }
}
