# Guía de HERE Maps SDK - Configuración y Uso

## 📚 Introducción

Esta guía proporciona instrucciones detalladas sobre cómo configurar y utilizar HERE Maps SDK en el sistema de seguimiento de entregas.

## 🔑 Credenciales de HERE Maps

### API Keys Configuradas
```typescript
hereMapsApiKey: 'GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw'
hereMapsAppId: '7LVwgFjjHhNtTtROLWKD'
```

### Servicios Disponibles
- **HERE Maps API for JavaScript v3.1**: Mapas interactivos
- **HERE Geocoding API**: Geocodificación directa e inversa
- **HERE Routing API v8**: Cálculo de rutas optimizadas
- **HERE Traffic API**: Información de tráfico en tiempo real

## 🗺️ Integración de HERE Maps en Angular

### 1. Configuración en index.html

El SDK se carga mediante scripts en `src/index.html`:

```html
<!-- HERE Maps Scripts -->
<script src="https://js.api.here.com/v3/3.1/mapsjs-core.js" 
        type="text/javascript" charset="utf-8"></script>
<script src="https://js.api.here.com/v3/3.1/mapsjs-service.js" 
        type="text/javascript" charset="utf-8"></script>
<script src="https://js.api.here.com/v3/3.1/mapsjs-ui.js" 
        type="text/javascript" charset="utf-8"></script>
<script src="https://js.api.here.com/v3/3.1/mapsjs-mapevents.js" 
        type="text/javascript" charset="utf-8"></script>
```

### 2. Servicio HereMapsService

El servicio principal está en `src/app/services/here-maps.service.ts` y proporciona:

#### Métodos Principales

##### Inicialización del Mapa
```typescript
async createMap(
  container: HTMLElement, 
  center: { lat: number; lng: number }, 
  zoom: number = 15
): Promise<{ map: any, ui: any, behavior: any }>
```

**Ejemplo de uso:**
```typescript
const mapData = await this.hereMapsService.createMap(
  this.mapContainer.nativeElement,
  { lat: 19.4326, lng: -99.1332 },
  12
);
this.map = mapData.map;
```

##### Geocodificación
```typescript
// Geocodificación directa (dirección → coordenadas)
async geocodeAddress(query: string): Promise<Address[]>

// Ejemplo:
const addresses = await this.hereMapsService.geocodeAddress(
  'Paseo de la Reforma 222, Ciudad de México'
);
```

```typescript
// Geocodificación inversa (coordenadas → dirección)
async reverseGeocode(lat: number, lng: number): Promise<Address>

// Ejemplo:
const address = await this.hereMapsService.reverseGeocode(
  19.4326, -99.1332
);
```

##### Cálculo de Rutas
```typescript
// Ruta simple entre dos puntos
async calculateRoute(
  origin: {lat: number, lng: number},
  destination: {lat: number, lng: number}
): Promise<any>

// Ejemplo:
const route = await this.hereMapsService.calculateRoute(
  { lat: 19.4326, lng: -99.1332 },
  { lat: 19.4284, lng: -99.1276 }
);
```

```typescript
// Ruta optimizada con múltiples waypoints
async calculateOptimizedRoute(
  startPoint: {lat: number, lng: number},
  waypoints: {lat: number, lng: number}[]
): Promise<any>

// Ejemplo:
const route = await this.hereMapsService.calculateOptimizedRoute(
  { lat: 19.4326, lng: -99.1332 },
  [
    { lat: 19.4284, lng: -99.1276 },
    { lat: 19.4240, lng: -99.1220 },
    { lat: 19.4196, lng: -99.1164 }
  ]
);
```

##### Marcadores
```typescript
// Agregar marcador simple
addMarker(
  map: any, 
  coordinates: { lat: number; lng: number }, 
  options?: any
): any

// Ejemplo:
const marker = this.hereMapsService.addMarker(
  this.map,
  { lat: 19.4326, lng: -99.1332 },
  { icon: customIcon }
);
```

```typescript
// Crear marcador personalizado con HTML
createCustomMarker(
  lat: number, 
  lng: number, 
  iconHtml: string, 
  data?: any
): any

// Ejemplo:
const html = `
  <div style="background: #007bff; width: 30px; height: 30px; 
              border-radius: 50%; border: 2px solid white;">
    1
  </div>
`;
const marker = this.hereMapsService.createCustomMarker(
  19.4326, -99.1332, html
);
this.map.addObject(marker);
```

##### Geocercas
```typescript
// Crear geocerca (círculo)
createGeofence(
  map: any, 
  lat: number, 
  lng: number, 
  radius: number = 200
): any

// Ejemplo:
const geofence = this.hereMapsService.createGeofence(
  this.map,
  19.4326,
  -99.1332,
  200  // 200 metros
);
```

##### Rutas en el Mapa
```typescript
// Dibujar ruta
drawRoute(
  map: any, 
  waypoints: { lat: number; lng: number }[]
): any

// Ejemplo:
const routeLine = this.hereMapsService.drawRoute(
  this.map,
  [
    { lat: 19.4326, lng: -99.1332 },
    { lat: 19.4284, lng: -99.1276 },
    { lat: 19.4240, lng: -99.1220 }
  ]
);
```

##### Ajustar Vista
```typescript
// Ajustar vista a coordenadas
fitBounds(
  map: any, 
  coordinates: { lat: number; lng: number }[]
): void

// Ejemplo:
this.hereMapsService.fitBounds(this.map, [
  { lat: 19.4326, lng: -99.1332 },
  { lat: 19.4284, lng: -99.1276 },
  { lat: 19.4240, lng: -99.1220 }
]);
```

##### Capa de Tráfico
```typescript
// Agregar capa de tráfico
addTrafficLayer(map: any): void

// Ejemplo:
this.hereMapsService.addTrafficLayer(this.map);
```

## 🧭 Uso en Componentes

### Ejemplo Completo: Crear Mapa con Marcadores y Rutas

```typescript
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HereMapsService } from './services/here-maps.service';

@Component({
  selector: 'app-mi-mapa',
  template: `<div #mapContainer style="width: 100%; height: 500px;"></div>`
})
export class MiMapaComponent implements OnInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  private map: any;
  
  constructor(private hereMapsService: HereMapsService) {}
  
  async ngOnInit() {
    // 1. Crear mapa
    const mapData = await this.hereMapsService.createMap(
      this.mapContainer.nativeElement,
      { lat: 19.4326, lng: -99.1332 },
      12
    );
    this.map = mapData.map;
    
    // 2. Agregar marcadores
    const origen = { lat: 19.4326, lng: -99.1332 };
    const destino = { lat: 19.4284, lng: -99.1276 };
    
    this.hereMapsService.addMarker(this.map, origen);
    this.hereMapsService.addMarker(this.map, destino);
    
    // 3. Calcular y dibujar ruta
    const route = await this.hereMapsService.calculateRoute(origen, destino);
    
    // Decodificar polyline y dibujar
    const polyline = route.sections[0].polyline;
    const coordinates = this.hereMapsService.decodePolyline(polyline);
    this.hereMapsService.drawRoute(this.map, coordinates);
    
    // 4. Crear geocerca en destino
    this.hereMapsService.createGeofence(this.map, destino.lat, destino.lng, 200);
    
    // 5. Ajustar vista
    this.hereMapsService.fitBounds(this.map, [origen, destino]);
  }
}
```

## 🔄 HERE Routing API v8

### Endpoints Disponibles

#### Ruta Simple
```
GET https://router.hereapi.com/v8/routes
  ?transportMode=car
  &origin=19.4326,-99.1332
  &destination=19.4284,-99.1276
  &return=polyline,summary
  &apikey=YOUR_API_KEY
```

#### Ruta con Waypoints
```
GET https://router.hereapi.com/v8/routes
  ?transportMode=car
  &origin=19.4326,-99.1332
  &via=19.4284,-99.1276
  &via=19.4240,-99.1220
  &destination=19.4326,-99.1332
  &return=polyline,summary
  &apikey=YOUR_API_KEY
```

### Respuesta del API
```json
{
  "routes": [
    {
      "sections": [
        {
          "id": "...",
          "type": "vehicle",
          "departure": {
            "place": {
              "type": "place",
              "location": {
                "lat": 19.4326,
                "lng": -99.1332
              }
            }
          },
          "arrival": {
            "place": {
              "type": "place",
              "location": {
                "lat": 19.4284,
                "lng": -99.1276
              }
            }
          },
          "summary": {
            "duration": 900,
            "length": 5000
          },
          "polyline": "encoded_polyline_string"
        }
      ]
    }
  ]
}
```

## 🎨 Personalización de Marcadores

### Marcador con Icono SVG
```typescript
const svgIcon = `
  <svg width="30" height="40" xmlns="http://www.w3.org/2000/svg">
    <path d="M15,0 C6.7,0 0,6.7 0,15 C0,25 15,40 15,40 S30,25 30,15 C30,6.7 23.3,0 15,0 Z" 
          fill="#007bff" stroke="#fff" stroke-width="2"/>
    <circle cx="15" cy="15" r="5" fill="#fff"/>
  </svg>
`;

const icon = new H.map.Icon(svgIcon, {
  anchor: { x: 15, y: 40 }
});

const marker = new H.map.Marker(
  { lat: 19.4326, lng: -99.1332 },
  { icon: icon }
);

map.addObject(marker);
```

### Marcador con HTML Personalizado
```typescript
const html = `
  <div class="custom-marker">
    <div class="marker-inner">
      <span>1</span>
    </div>
    <div class="marker-arrow"></div>
  </div>
`;

const marker = this.hereMapsService.createCustomMarker(
  19.4326,
  -99.1332,
  html,
  { id: 1, name: 'Cliente A' }
);
```

## 📏 Cálculos Geoespaciales

### Distancia entre dos puntos (Haversine)
```typescript
calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = coord1.lat * Math.PI / 180;
  const φ2 = coord2.lat * Math.PI / 180;
  const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
  const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}
```

### Validar Coordenadas
```typescript
validateCoordinates(coord: {lat: number, lng: number}): boolean {
  return coord.lat >= -90 && coord.lat <= 90 && 
         coord.lng >= -180 && coord.lng <= 180 &&
         !isNaN(coord.lat) && !isNaN(coord.lng);
}
```

## 🌐 Geocoding API

### Geocodificación Directa
```
GET https://geocode.search.hereapi.com/v1/geocode
  ?q=Paseo+de+la+Reforma+222,+Ciudad+de+Mexico
  &apikey=YOUR_API_KEY
```

### Geocodificación Inversa
```
GET https://revgeocode.search.hereapi.com/v1/revgeocode
  ?at=19.4326,-99.1332
  &apikey=YOUR_API_KEY
```

## ⚡ Mejores Prácticas

### 1. Inicialización Asíncrona
```typescript
async ngOnInit() {
  try {
    await this.hereMapsService.ensureInitialized();
    // Tu código aquí
  } catch (error) {
    console.error('Error al inicializar HERE Maps:', error);
  }
}
```

### 2. Limpieza de Recursos
```typescript
ngOnDestroy() {
  // Remover marcadores
  this.markers.forEach(marker => {
    this.hereMapsService.removeMarkerSafely(this.map, marker);
  });
  
  // Limpiar mapa
  if (this.map) {
    this.map.dispose();
  }
}
```

### 3. Manejo de Errores
```typescript
try {
  const addresses = await this.hereMapsService.geocodeAddress(query);
  if (addresses.length === 0) {
    console.warn('No se encontraron resultados');
  }
} catch (error) {
  console.error('Error en geocodificación:', error);
  // Mostrar mensaje al usuario
}
```

### 4. Optimización de Rendimiento
- Limitar número de marcadores simultáneos (máx. 100-200)
- Usar clustering para grandes cantidades de puntos
- Implementar lazy loading de datos
- Cachear resultados de geocodificación

## 🔒 Seguridad

### Producción
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  hereMapsApiKey: process.env['HERE_MAPS_API_KEY'] || '',
  // Nunca hardcodear API keys en producción
};
```

### Restricciones de API Key
En el portal de HERE:
1. Limitar por dominio
2. Limitar por IP
3. Configurar cuotas de uso
4. Habilitar solo servicios necesarios

## 📱 Responsive Design

### Ajustar Mapa a Contenedor
```typescript
window.addEventListener('resize', () => {
  if (this.map) {
    this.map.getViewPort().resize();
  }
});
```

## 🐛 Debugging

### Verificar Carga de SDK
```typescript
if (typeof H === 'undefined') {
  console.error('HERE Maps SDK no cargado');
}
```

### Logs de Desarrollo
```typescript
console.log('Mapa creado:', this.map);
console.log('Coordenadas:', { lat, lng });
console.log('Ruta calculada:', route);
```

## 📚 Recursos Adicionales

- [HERE Developer Portal](https://developer.here.com/)
- [HERE Maps API for JavaScript Documentation](https://developer.here.com/documentation/maps/3.1.0/dev_guide/index.html)
- [HERE Routing API v8 Documentation](https://developer.here.com/documentation/routing-api/8/dev_guide/index.html)
- [HERE Geocoding API Documentation](https://developer.here.com/documentation/geocoding-search-api/dev_guide/index.html)

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025
