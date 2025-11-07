import { Injectable } from '@angular/core';
import { Observable, Subject, fromEvent } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface ChoferMovimiento {
  choferId: number;
  lat: number;
  lng: number;
  timestamp: string;
  velocidad?: number;
  heading?: number;
}

export interface ChoferGeocerca {
  choferId: number;
  ordenId: string;
  accion: string;
}

export interface EntregaCompletada {
  choferId: number;
  ordenId: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;
  private connected = false;

  private choferMovimientoSubject = new Subject<ChoferMovimiento>();
  private choferGeocercaSubject = new Subject<ChoferGeocerca>();
  private entregaCompletadaSubject = new Subject<EntregaCompletada>();

  public choferMovimiento$ = this.choferMovimientoSubject.asObservable();
  public choferGeocerca$ = this.choferGeocercaSubject.asObservable();
  public entregaCompletada$ = this.entregaCompletadaSubject.asObservable();

  constructor() {}

  connect(): void {
    if (this.connected) {
      console.log('WebSocket ya está conectado');
      return;
    }

    try {
      this.socket = io(environment.backendUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('WebSocket conectado');
        this.connected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket desconectado');
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Error de conexión WebSocket:', error);
      });

      // Eventos de negocio
      this.socket.on('chofer_movimiento', (data: ChoferMovimiento) => {
        this.choferMovimientoSubject.next(data);
      });

      this.socket.on('chofer_geocerca', (data: ChoferGeocerca) => {
        this.choferGeocercaSubject.next(data);
      });

      this.socket.on('entrega_completada', (data: EntregaCompletada) => {
        this.entregaCompletadaSubject.next(data);
      });

    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  subscribeToTracking(almacenId: number): void {
    if (this.socket && this.connected) {
      this.socket.emit('subscribe_tracking', { almacenId });
    }
  }

  unsubscribeFromTracking(almacenId: number): void {
    if (this.socket && this.connected) {
      this.socket.emit('unsubscribe_tracking', { almacenId });
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  onChoferMovement(callback: (data: ChoferMovimiento) => void): void {
    this.choferMovimiento$.subscribe(callback);
  }

  onGeofenceEvent(callback: (data: ChoferGeocerca) => void): void {
    this.choferGeocerca$.subscribe(callback);
  }

  onEntregaCompletada(callback: (data: EntregaCompletada) => void): void {
    this.entregaCompletada$.subscribe(callback);
  }
}
