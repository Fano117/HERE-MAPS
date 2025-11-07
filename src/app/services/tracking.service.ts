import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith } from 'rxjs';
import { environment } from '../../environments/environment';
import { WebsocketService } from './websocket.service';

export interface ChoferLocation {
  choferId: number;
  lat: number;
  lng: number;
  timestamp: string;
  velocidad?: number;
  heading?: number;
}

export interface LiveChofer {
  choferId: number;
  nombre: string;
  ubicacionActual: {
    lat: number;
    lng: number;
  };
  ultimaActualizacion: string;
  velocidad: number;
  proximaEntrega?: {
    ordenId: string;
    distancia: number;
    eta: string;
  };
}

export interface GeofenceCheck {
  dentroGeocerca: boolean;
  distancia: number;
  ordenId: string | null;
  accionRequerida: 'notificar_cliente' | 'habilitar_entrega' | null;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private baseUrl = environment.backendUrl;

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService
  ) {}

  // Actualizar ubicación de chofer
  updateChoferPosition(choferId: number, lat: number, lng: number, velocidad?: number, heading?: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/tracking/update`, {
      choferId,
      lat,
      lng,
      timestamp: new Date().toISOString(),
      velocidad,
      heading
    });
  }

  // Obtener ubicaciones en tiempo real
  getLiveTracking(almacenId: number): Observable<{ choferes: LiveChofer[] }> {
    return this.http.get<{ choferes: LiveChofer[] }>(
      `${this.baseUrl}/api/tracking/live/${almacenId}`
    );
  }

  // Suscribirse a actualizaciones de chofer (polling)
  subscribeToChoferUpdates(almacenId: number, intervalMs: number = 5000): Observable<{ choferes: LiveChofer[] }> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getLiveTracking(almacenId))
    );
  }

  // Verificar proximidad a geocerca
  checkGeofenceProximity(choferId: number, lat: number, lng: number): Observable<GeofenceCheck> {
    return this.http.post<GeofenceCheck>(`${this.baseUrl}/api/geofence/check`, {
      choferId,
      lat,
      lng
    });
  }

  // Configurar geocercas
  setupGeofences(embarqueId: number, entregas: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/geofence/setup`, {
      embarqueId,
      entregas
    });
  }

  // Calcular ETA
  getETA(origen: { lat: number; lng: number }, destino: { lat: number; lng: number }): Observable<any> {
    // Calcular ETA simple basado en distancia
    const distancia = this.calculateDistance(origen, destino);
    const velocidadPromedio = 40; // km/h
    const tiempoMinutos = Math.round((distancia / 1000) / velocidadPromedio * 60);
    
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + tiempoMinutos);
    
    return new Observable(observer => {
      observer.next({
        distancia,
        tiempoMinutos,
        eta: eta.toISOString()
      });
      observer.complete();
    });
  }

  // Calcular distancia entre dos puntos (Haversine)
  private calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371e3; // Radio de la Tierra en metros
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
}
