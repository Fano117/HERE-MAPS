import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

declare var H: any;

export interface Address {
  id: string;
  label: string;
  houseNumber?: string;
  street?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  countryName?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface LocationUpdate {
  driverId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  speed?: number;
  heading?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HereMapsService {
  private platform: any;
  private geocoder: any;
  private readonly API_KEY = 'GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw';
  private initialized = false;

  private currentLocationSubject = new BehaviorSubject<LocationUpdate | null>(null);
  currentLocation$ = this.currentLocationSubject.asObservable();

  constructor() {
    this.ensureInitialized();
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.waitForHereMaps();
      this.initializePlatform();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Error al inicializar HERE Maps: ${error instanceof Error ? error.message : error}`);
    }
  }

  private waitForHereMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkHereAPI = () => {
        return typeof H !== 'undefined' && 
               H && 
               H.service && 
               H.service.Platform && 
               H.Map && 
               H.mapevents && 
               H.mapevents.Behavior && 
               H.ui && 
               H.ui.UI && 
               H.map && 
               H.map.Marker &&
               H.map.Icon &&
               (window as any).hereMapsReady === true;
      };

      if (checkHereAPI()) {
        resolve();
        return;
      }
      
      const checkInterval = setInterval(() => {
        if (checkHereAPI()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        if (checkHereAPI()) {
          resolve();
        } else {
          reject(new Error('Timeout: HERE Maps API no se cargó correctamente'));
        }
      }, 20000);
    });
  }

  private initializePlatform(): void {
    this.platform = new H.service.Platform({
      'apikey': this.API_KEY
    });
    this.geocoder = this.platform.getSearchService();
  }

  async geocodeAddress(query: string): Promise<Address[]> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({
        q: query
      }, (result: any) => {
        const addresses: Address[] = result.items.map((item: any) => ({
          id: item.id,
          label: item.address?.label || item.title,
          houseNumber: item.address?.houseNumber,
          street: item.address?.street,
          district: item.address?.district,
          city: item.address?.city,
          postalCode: item.address?.postalCode,
          countryName: item.address?.countryName,
          coordinates: {
            lat: item.position.lat,
            lng: item.position.lng
          }
        }));
        resolve(addresses);
      }, (error: any) => {
        reject(error);
      });
    });
  }

  async reverseGeocode(lat: number, lng: number): Promise<Address> {
    await this.ensureInitialized();
    return new Promise((resolve, reject) => {
      this.geocoder.reverseGeocode({
        at: `${lat},${lng}`
      }, (result: any) => {
        if (result.items && result.items.length > 0) {
          const item = result.items[0];
          const address: Address = {
            id: item.id,
            label: item.address?.label || item.title,
            houseNumber: item.address?.houseNumber,
            street: item.address?.street,
            district: item.address?.district,
            city: item.address?.city,
            postalCode: item.address?.postalCode,
            countryName: item.address?.countryName,
            coordinates: {
              lat: item.position.lat,
              lng: item.position.lng
            }
          };
          resolve(address);
        } else {
          reject(new Error('No address found'));
        }
      }, (error: any) => {
        reject(error);
      });
    });
  }

  validateAddress(address: string): Promise<{ isValid: boolean; suggestions: Address[] }> {
    return new Promise(async (resolve) => {
      try {
        const results = await this.geocodeAddress(address);
        if (results.length > 0) {
          const topResult = results[0];
          const isExactMatch = this.isExactAddressMatch(address, topResult.label);
          resolve({
            isValid: isExactMatch,
            suggestions: results
          });
        } else {
          resolve({
            isValid: false,
            suggestions: []
          });
        }
      } catch (error) {
        resolve({
          isValid: false,
          suggestions: []
        });
      }
    });
  }

  private isExactAddressMatch(input: string, result: string): boolean {
    const normalizeString = (str: string) => {
      return str.toLowerCase()
        .replace(/[,\.]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedInput = normalizeString(input);
    const normalizedResult = normalizeString(result);

    return normalizedResult.includes(normalizedInput) || normalizedInput.includes(normalizedResult);
  }

  async createMap(container: HTMLElement, center: { lat: number; lng: number }, zoom: number = 15): Promise<any> {
    try {
      await this.ensureInitialized();
      
      if (!container) {
        throw new Error('Container del mapa no válido');
      }

      if (!this.platform) {
        throw new Error('Platform no inicializada');
      }

      if (typeof H === 'undefined' || !H.Map) {
        throw new Error('HERE Maps API no disponible');
      }

      let defaultLayers;
      try {
        defaultLayers = this.platform.createDefaultLayers();
      } catch (error) {
        throw new Error('No se pudieron crear las capas por defecto: ' + error);
      }
      
      if (!defaultLayers) {
        throw new Error('defaultLayers es null o undefined');
      }

      if (!defaultLayers.vector) {
        throw new Error('defaultLayers.vector no está disponible');
      }

      if (!defaultLayers.vector.normal) {
        throw new Error('defaultLayers.vector.normal no está disponible');
      }

      if (!defaultLayers.vector.normal.map) {
        throw new Error('defaultLayers.vector.normal.map no está disponible');
      }

      const mapLayer = defaultLayers.vector.normal.map;
      
      let map;
      try {
        map = new H.Map(
          container,
          mapLayer,
          {
            zoom: zoom,
            center: { lat: center.lat, lng: center.lng }
          }
        );
      } catch (error) {
        throw new Error('Error al crear instancia del mapa: ' + error);
      }

      if (!map) {
        throw new Error('El mapa no se pudo crear');
      }

      let behavior;
      try {
        behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
      } catch (error) {
        throw new Error('Error al crear behavior: ' + error);
      }

      let ui;
      try {
        ui = H.ui.UI.createDefault(map, defaultLayers);
      } catch (error) {
        ui = null;
      }

      return { map, ui, behavior };
    } catch (error) {
      throw new Error(`Error al crear el mapa: ${error instanceof Error ? error.message : error}`);
    }
  }

  addMarker(map: any, coordinates: { lat: number; lng: number }, options?: any): any {
    const marker = new H.map.Marker(coordinates, options);
    map.addObject(marker);
    return marker;
  }

  removeMarkerSafely(map: any, marker: any): void {
    if (!map || !marker) return;
    
    try {
      const objects = map.getObjects();
      if (objects && objects.indexOf(marker) !== -1) {
        map.removeObject(marker);
      }
    } catch (error) {
      // Ignorar errores de remoción
    }
  }

  updateLocation(locationUpdate: LocationUpdate): void {
    this.currentLocationSubject.next(locationUpdate);
  }

  getCurrentLocation(): LocationUpdate | null {
    return this.currentLocationSubject.value;
  }

  async calculateRoute(origin: {lat: number, lng: number}, destination: {lat: number, lng: number}): Promise<any> {
    await this.ensureInitialized();
    
    const response = await fetch(
      `https://router.hereapi.com/v8/routes?transportMode=car&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&return=polyline,summary&apikey=${this.API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Error al calcular la ruta');
    }
    
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      return data.routes[0];
    }
    
    throw new Error('No se pudo calcular la ruta');
  }

  async calculateOptimizedRoute(startPoint: {lat: number, lng: number}, waypoints: {lat: number, lng: number}[]): Promise<any> {
    await this.ensureInitialized();
    
    if (waypoints.length === 0) return null;
    
    // Validar coordenadas
    if (!this.validateCoordinates(startPoint)) {
      throw new Error('Coordenadas del punto de inicio inválidas');
    }
    
    const validWaypoints = waypoints.filter(wp => this.validateCoordinates(wp));
    if (validWaypoints.length === 0) {
      throw new Error('No hay waypoints válidos');
    }
    
    try {
      // Calcular ruta simple visitando todos los puntos y regresando
      const allRouteSegments = [];
      let currentPoint = startPoint;
      
      // Ir a cada waypoint
      for (const waypoint of validWaypoints) {
        const routeSegment = await this.calculateRoute(currentPoint, waypoint);
        allRouteSegments.push(routeSegment);
        currentPoint = waypoint;
      }
      
      // Regresar al punto de inicio
      const returnSegment = await this.calculateRoute(currentPoint, startPoint);
      allRouteSegments.push(returnSegment);
      
      // Combinar todos los segmentos
      const combinedRoute = this.combineRouteSegments(allRouteSegments);
      
      console.log('Successfully calculated optimized route with', allRouteSegments.length, 'segments');
      return combinedRoute;
      
    } catch (error) {
      console.error('Error in calculateOptimizedRoute:', error);
      throw error;
    }
  }

  private combineRouteSegments(segments: any[]): any {
    if (segments.length === 0) return null;
    
    const combinedSections = segments.map(segment => segment.sections[0]);
    const totalSummary = segments.reduce((acc, segment) => {
      const section = segment.sections[0];
      acc.length += section.summary.length;
      acc.duration += section.summary.duration;
      return acc;
    }, { length: 0, duration: 0 });
    
    return {
      sections: combinedSections,
      summary: totalSummary
    };
  }

  private validateCoordinates(coord: {lat: number, lng: number}): boolean {
    return coord.lat >= -90 && coord.lat <= 90 && 
           coord.lng >= -180 && coord.lng <= 180 &&
           !isNaN(coord.lat) && !isNaN(coord.lng);
  }

  decodePolyline(polyline: string): {lat: number, lng: number}[] {
    if (!polyline || typeof polyline !== 'string' || polyline.length === 0) {
      return [];
    }
    
    const coordinates: {lat: number, lng: number}[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < polyline.length) {
      let b: number;
      let shift = 0;
      let result = 0;
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;
      do {
        b = polyline.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      const decodedLat = lat / 1e5;
      const decodedLng = lng / 1e5;
      
      if (this.validateCoordinates({lat: decodedLat, lng: decodedLng})) {
        coordinates.push({
          lat: decodedLat,
          lng: decodedLng
        });
      }
    }

    return coordinates;
  }
}
