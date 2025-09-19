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
      <h3>Direcciones Guardadas</h3>
      <div *ngFor="let address of savedAddresses" class="saved-address"
           style="padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 4px;">
        <strong>{{ address.label }}</strong>
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

  constructor(
    private hereMapsService: HereMapsService,
    private addressService: AddressService
  ) {}

  ngOnInit(): void {
    this.addressService.addresses$.subscribe(addresses => {
      this.savedAddresses = addresses;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
    }, 500);
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

  async validateAddress(): Promise<void> {
    if (!this.addressInput.trim()) {
      this.validationError = 'Por favor ingresa una dirección';
      return;
    }

    try {
      this.validationError = '';
      this.validationSuccess = '';
      
      const validation = await this.hereMapsService.validateAddress(this.addressInput);
      
      if (validation.isValid) {
        this.validationSuccess = 'Dirección válida encontrada';
        this.selectedAddress = validation.suggestions[0];
        this.suggestions = validation.suggestions;
        this.updateMapWithAddress(this.selectedAddress);
      } else if (validation.suggestions.length > 0) {
        this.validationError = 'Dirección no exacta. Por favor selecciona una de las sugerencias:';
        this.suggestions = validation.suggestions;
        this.selectedAddress = null;
      } else {
        this.validationError = 'No se encontraron direcciones similares. Intenta con una dirección diferente.';
        this.suggestions = [];
        this.selectedAddress = null;
      }
    } catch (error) {
      this.validationError = 'Error al validar la dirección. Intenta nuevamente.';
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
}
