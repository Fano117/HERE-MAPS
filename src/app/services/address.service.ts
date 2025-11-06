import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Address } from './here-maps.service';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private addresses = new BehaviorSubject<Address[]>([]);
  addresses$ = this.addresses.asObservable();

  constructor() {
    this.loadStoredAddresses();
  }

  private loadStoredAddresses(): void {
    const stored = localStorage.getItem('here_maps_addresses');
    if (stored) {
      try {
        const addresses = JSON.parse(stored);
        this.addresses.next(addresses);
      } catch (error) {
        this.addresses.next([]);
      }
    }
  }

  private saveAddresses(addresses: Address[]): void {
    localStorage.setItem('here_maps_addresses', JSON.stringify(addresses));
    this.addresses.next(addresses);
  }

  addAddress(address: Address): void {
    // Validar que las coordenadas sean válidas antes de guardar
    if (!this.isValidCoordinate(address.coordinates)) {
      console.warn('Rejecting address with invalid coordinates:', address);
      return;
    }
    
    const currentAddresses = this.addresses.value;
    const existingIndex = currentAddresses.findIndex(a => a.id === address.id);
    
    if (existingIndex >= 0) {
      currentAddresses[existingIndex] = address;
    } else {
      currentAddresses.push(address);
    }
    
    this.saveAddresses(currentAddresses);
  }

  private isValidCoordinate(coord: {lat: number, lng: number}): boolean {
    // Verificar que sean números válidos
    if (isNaN(coord.lat) || isNaN(coord.lng)) return false;
    
    // Verificar rangos globales básicos
    if (coord.lat < -90 || coord.lat > 90) return false;
    if (coord.lng < -180 || coord.lng > 180) return false;
    
    // Verificar que estén dentro del área metropolitana de Ciudad de México
    const bounds = {
      minLat: 19.0,   
      maxLat: 19.8,   
      minLng: -99.5,  
      maxLng: -98.8   
    };
    
    return coord.lat >= bounds.minLat && coord.lat <= bounds.maxLat &&
           coord.lng >= bounds.minLng && coord.lng <= bounds.maxLng;
  }

  removeAddress(addressId: string): void {
    const currentAddresses = this.addresses.value;
    const filteredAddresses = currentAddresses.filter(a => a.id !== addressId);
    this.saveAddresses(filteredAddresses);
  }

  getAddresses(): Address[] {
    return this.addresses.value;
  }

  clearAllAddresses(): void {
    this.saveAddresses([]);
  }
}
