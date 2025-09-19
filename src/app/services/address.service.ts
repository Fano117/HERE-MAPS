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
    const currentAddresses = this.addresses.value;
    const existingIndex = currentAddresses.findIndex(a => a.id === address.id);
    
    if (existingIndex >= 0) {
      currentAddresses[existingIndex] = address;
    } else {
      currentAddresses.push(address);
    }
    
    this.saveAddresses(currentAddresses);
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
