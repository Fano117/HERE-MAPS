# Integraciones y Funcionalidades de HERE Maps

Este documento lista todas las integraciones, funcionalidades y componentes implementados en el proyecto HERE Maps, indicando su ubicación y propósito.

---

## 📍 Servicios Frontend (Angular)

### 1. HERE Maps Service
**Ubicación:** `src/app/services/here-maps.service.ts`

**Funcionalidades:**
- ✅ **Geocodificación directa**: Convierte direcciones de texto a coordenadas geográficas
- ✅ **Geocodificación inversa**: Convierte coordenadas a direcciones legibles
- ✅ **Validación de direcciones**: Verifica si una dirección es válida y ofrece sugerencias
- ✅ **Creación de mapas interactivos**: Inicializa mapas HERE con UI y controles
- ✅ **Gestión de marcadores**: Añade, actualiza y elimina marcadores en el mapa
- ✅ **Cálculo de rutas**: Calcula rutas entre dos puntos usando HERE Routing API v8
- ✅ **Optimización de rutas**: Calcula rutas optimizadas con múltiples waypoints
- ✅ **Decodificación de polylines**: Decodifica polylines de rutas a coordenadas
- ✅ **Rastreo de ubicación**: Observable para actualizaciones de ubicación en tiempo real
- ✅ **Validación de coordenadas**: Verifica que las coordenadas sean válidas globalmente

**API Key configurada:** `GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw`

**Métodos principales:**
```typescript
- geocodeAddress(query: string): Promise<Address[]>
- reverseGeocode(lat: number, lng: number): Promise<Address>
- validateAddress(address: string): Promise<{isValid: boolean, suggestions: Address[]}>
- createMap(container: HTMLElement, center, zoom): Promise<any>
- addMarker(map, coordinates, options): any
- calculateRoute(origin, destination): Promise<any>
- calculateOptimizedRoute(startPoint, waypoints): Promise<any>
- decodePolyline(polyline: string): Coordinate[]
- updateLocation(locationUpdate: LocationUpdate): void
```

---

### 2. Address Service
**Ubicación:** `src/app/services/address.service.ts`

**Funcionalidades:**
- ✅ **Almacenamiento local**: Guarda direcciones en localStorage
- ✅ **Gestión de direcciones**: CRUD de direcciones validadas
- ✅ **Validación de coordenadas**: Verifica coordenadas dentro de Ciudad de México
- ✅ **Observable de direcciones**: Stream reactivo de cambios en direcciones
- ✅ **Persistencia**: Carga automática de direcciones al iniciar

**Área de cobertura validada:**
- Latitud: 19.0° a 19.8° (Zona Metropolitana de CDMX)
- Longitud: -99.5° a -98.8°

**Métodos principales:**
```typescript
- addAddress(address: Address): void
- removeAddress(addressId: string): void
- getAddresses(): Address[]
- clearAllAddresses(): void
- addresses$: Observable<Address[]>
```

---

### 3. Polygon Analysis Service
**Ubicación:** `src/app/services/polygon-analysis.service.ts`

**Funcionalidades:**
- ✅ **Análisis de puntos**: Determina si coordenadas están dentro de polígonos de cobertura
- ✅ **Análisis de direcciones**: Verifica cobertura de direcciones específicas
- ✅ **Cálculo de distancias**: Calcula distancia al polígono más cercano
- ✅ **Integración con backend**: Consulta servicio de análisis de polígonos

**Métodos principales:**
```typescript
- analyzeAddressPoint(lat, lng, address?): Observable<PolygonAnalysisResult>
- analyzeMapPoint(lat, lng): Observable<PolygonAnalysisResult>
```

**Estados posibles:**
- `inside`: Punto dentro de un polígono de cobertura
- `outside`: Punto fuera de todos los polígonos
- `no_polygons`: No hay polígonos definidos

---

## 🎯 Componentes Frontend (Angular)

### 1. Address Management Component
**Ubicación:** `src/app/components/address-management/address-management.component.ts`

**Funcionalidades:**
- ✅ **Validación automática de direcciones**: Ingresa texto y valida con HERE API
- ✅ **Sugerencias de direcciones**: Muestra múltiples opciones cuando la dirección es ambigua
- ✅ **Selección manual en mapa**: Click en el mapa para obtener dirección por geocodificación inversa
- ✅ **Punto de partida**: Define punto inicial para cálculo de rutas
- ✅ **Gestión de direcciones guardadas**: Ver, eliminar y visualizar direcciones en mapa
- ✅ **Cálculo de ruta optimizada**: Planifica ruta visitando todas las direcciones guardadas
- ✅ **Visualización de ruta en mapa**: Muestra polyline de la ruta calculada
- ✅ **Resumen de ruta**: Distancia total, tiempo estimado, número de paradas

**Ejemplos de direcciones válidas:**
```
✅ PROL CUITLAHUAC, San Martín Centro, San Martín de las Pirámides, Estado de México, 55850, México
❌ S155-CUA James Watt 35, , ,MEX,54730.
```

**Características de optimización:**
- Usa HERE Routing API v8 con múltiples waypoints (hasta 23)
- Calcula ruta circular (regresa al punto de inicio)
- Muestra si usa optimización de API o cálculo manual

---

### 2. Tracking View Component
**Ubicación:** `src/app/components/tracking-view/tracking-view.component.ts`

**Funcionalidades:**
- ✅ **Selección de conductor**: Dropdown con conductores disponibles (driver1, driver2, driver3)
- ✅ **Rastreo en tiempo real**: Actualización automática cada 5 segundos
- ✅ **Visualización en mapa**: Marcador de ubicación actual del conductor
- ✅ **Puntos de entrega**: Muestra todas las direcciones guardadas como marcadores
- ✅ **Estados de entrega**: Marca entregas como completadas (radio < 100m)
- ✅ **Cálculo de distancias**: Distancia del conductor a cada punto de entrega
- ✅ **Geocodificación inversa**: Muestra dirección actual del conductor
- ✅ **Ruta optimizada visual**: Dibuja la ruta completa en el mapa
- ✅ **Información del conductor**: Coordenadas, velocidad, última actualización

**Conductores disponibles:**
- Juan Pérez (driver1)
- María González (driver2)
- Carlos López (driver3)

**Estados de puntos de entrega:**
- 🔴 Pendiente (rojo)
- 📍 Ubicación actual (naranja)
- ✅ Completado (verde) - cuando distancia < 100m

---

### 3. Address Search Component
**Ubicación:** `src/app/components/address-search/address-search.component.ts`

**Funcionalidades:**
- ✅ **Búsqueda de direcciones**: Componente reutilizable para búsqueda
- ✅ **Autocompletado**: Sugerencias mientras se escribe
- ✅ **Integración con HERE Maps Service**: Usa geocodificación

---

## 🖥️ Backend (Express.js)

### Servidor Principal
**Ubicación:** `backend/server.js`

**Configuración:**
- Puerto: 3000 (configurable via env)
- CORS habilitado para `http://localhost:4200`
- Endpoints RESTful organizados por servicios

---

### 1. Location Service
**Ubicación:** `backend/services/locationService.js`

**Funcionalidades:**
- ✅ **Obtener ubicación de conductor**: `GET /api/location/:driverId`
- ✅ **Actualizar ubicación**: `POST /api/location/:driverId`
- ✅ **Simulación de movimiento**: `GET /api/simulation/start/:driverId`
- ✅ **Detener simulación**: `GET /api/simulation/stop/:driverId`
- ✅ **Datos dummy**: Rutas predefinidas para 3 conductores
- ✅ **Interpolación de coordenadas**: Simula movimiento fluido entre puntos

**Endpoints:**
```javascript
GET  /api/location/:driverId          // Obtener ubicación actual
POST /api/location/:driverId          // Actualizar ubicación manual
GET  /api/simulation/start/:driverId  // Iniciar simulación automática
GET  /api/simulation/stop/:driverId   // Detener simulación
```

---

### 2. Route Service
**Ubicación:** `backend/services/routeService.js`

**Funcionalidades:**
- ✅ **Obtener ruta de conductor**: `GET /api/routes/:driverId`
- ✅ **Actualizar ruta**: `POST /api/routes/:driverId`
- ✅ **Direcciones problemáticas**: `GET /api/addresses/problematic`
- ✅ **Gestión de puntos de entrega**: Añadir/eliminar paradas
- ✅ **Estado de entregas**: Completadas vs pendientes

**Endpoints:**
```javascript
GET  /api/routes/:driverId            // Obtener ruta del conductor
POST /api/routes/:driverId            // Actualizar ruta de entrega
GET  /api/addresses/problematic       // Obtener direcciones con problemas
```

---

### 3. Coverage Service
**Ubicación:** `backend/services/coverageService.js`

**Funcionalidades:**
- ✅ **Gestión de polígonos**: CRUD de áreas de cobertura
- ✅ **Almacenamiento en archivo**: Persiste en `backend/data/coverage-polygons.json`
- ✅ **Validación de polígonos**: Verifica formato GeoJSON

**Endpoints:**
```javascript
GET    /api/coverage                  // Obtener todos los polígonos
POST   /api/coverage                  // Crear nuevo polígono
POST   /api/coverage/:id              // Actualizar polígono existente
POST   /api/coverage/delete/:id       // Eliminar polígono
```

**Formato de datos:**
```json
{
  "id": "string",
  "name": "string",
  "type": "polygon",
  "coordinates": [[lat, lng], [lat, lng], ...]
}
```

---

### 4. Polygon Analysis Service
**Ubicación:** `backend/services/polygonAnalysisService.js`

**Funcionalidades:**
- ✅ **Análisis punto-en-polígono**: Algoritmo ray-casting
- ✅ **Cálculo de distancia a polígono**: Distancia mínima cuando está fuera
- ✅ **Análisis de direcciones**: Verifica cobertura de una dirección
- ✅ **Análisis de puntos de mapa**: Verifica cobertura de coordenadas
- ✅ **Retorna todos los polígonos contenedores**: Cuando hay múltiples

**Endpoints:**
```javascript
POST /api/polygon-analysis/address    // Analizar dirección específica
POST /api/polygon-analysis/point      // Analizar punto en mapa
```

**Algoritmos implementados:**
- Ray-casting para punto-en-polígono
- Distancia punto-a-segmento
- Distancia punto-a-polígono (mínima de todos los segmentos)

---

## 🗺️ Configuración de HERE Maps

### Credenciales
- **App ID**: `7LVwgFjjHhNtTtROLWKD`
- **API Key**: `GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw`

### APIs Utilizadas
1. **HERE Geocoding API**: Búsqueda y validación de direcciones
2. **HERE Reverse Geocoding API**: Coordenadas a direcciones
3. **HERE Routing API v8**: Cálculo de rutas y optimización
4. **HERE Maps API v3**: Visualización interactiva de mapas

### Capas de Mapa
- `vector.normal.map`: Capa de mapa vectorial estándar
- Marcadores personalizados con iconos
- Polylines para rutas
- UI por defecto con zoom y controles

---

## 📱 Integración React Native

**Ubicación:** `REACT_NATIVE_IMPLEMENTATION.md`

**Funcionalidades documentadas:**
- ✅ Instalación de HERE SDK para React Native
- ✅ Configuración Android y iOS
- ✅ Componente de mapa nativo
- ✅ Recepción de coordenadas desde Angular
- ✅ Rastreo GPS del dispositivo
- ✅ Sincronización con backend
- ✅ Navegación turn-by-turn
- ✅ Actualización de estado de entregas

---

## 🎨 Rutas de la Aplicación

**Ubicación:** `src/app/app.routes.ts`

### Rutas configuradas:
1. `/` → Redirige a `/address`
2. `/address` → Gestión de Direcciones (AddressManagementComponent)
3. `/tracking` → Rastreo en Tiempo Real (TrackingViewComponent)
4. `/coverage` → Análisis de Cobertura (CoverageComponent) - **PENDIENTE**

---

## 📊 Almacenamiento de Datos

### Frontend (localStorage)
- **Key**: `here_maps_addresses`
- **Contenido**: Array de direcciones validadas con coordenadas
- **Formato**: JSON

### Backend (Archivo)
- **Ubicación**: `backend/data/coverage-polygons.json`
- **Contenido**: Polígonos de áreas de cobertura
- **Formato**: JSON Array

---

## 🔄 Flujos de Trabajo

### 1. Validación de Dirección
```
Usuario ingresa texto
  ↓
HERE Geocoding API
  ↓
Validación de exactitud
  ↓
Sugerencias o confirmación
  ↓
Almacenamiento en localStorage
```

### 2. Rastreo de Conductor
```
Selección de conductor
  ↓
Backend: Iniciar simulación
  ↓
Actualización cada 5s
  ↓
Frontend: Actualizar mapa
  ↓
Geocodificación inversa
  ↓
Cálculo de distancias
  ↓
Actualización de estados
```

### 3. Optimización de Ruta
```
Direcciones guardadas
  ↓
HERE Routing API v8
  ↓
Multi-waypoint route
  ↓
Decodificación polyline
  ↓
Visualización en mapa
  ↓
Resumen de ruta
```

---

## ⚡ Características Técnicas

### Frontend
- **Framework**: Angular 18
- **Arquitectura**: Componentes standalone
- **Reactive**: RxJS Observables
- **HTTP**: HttpClient con CORS
- **Estilos**: CSS vanilla con clases utilitarias

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Middleware**: CORS, JSON parser
- **Persistencia**: Archivos JSON
- **Simulación**: Intervalos con setTimeout

### Integración
- **APIs**: REST con JSON
- **Tiempo real**: Polling cada 5 segundos
- **Geocodificación**: HERE Maps APIs
- **Mapas**: HERE Maps JavaScript API v3

---

## 🚀 Próximas Mejoras Sugeridas

1. **Seguridad**
   - Mover API Keys a variables de entorno
   - Implementar autenticación de usuarios
   - Rate limiting en backend

2. **Base de Datos**
   - Migrar de archivos JSON a MongoDB/PostgreSQL
   - Histórico de entregas y rutas
   - Auditoría de cambios

3. **Funcionalidades**
   - WebSockets para actualizaciones en tiempo real
   - Notificaciones push
   - Optimización de rutas con traffic data
   - Múltiples zonas de cobertura
   - Dashboard de analíticas

4. **Performance**
   - Cache de direcciones geocodificadas
   - Service Workers para offline support
   - Lazy loading de módulos
   - Compresión de respuestas

5. **Testing**
   - Unit tests con Jasmine/Karma
   - Integration tests
   - E2E tests con Cypress

---

## 📝 Notas Importantes

- Las coordenadas están validadas para la Zona Metropolitana de Ciudad de México
- La simulación de conductores usa rutas predefinidas
- El cálculo de ruta optimizada intenta primero con API multi-waypoint, si falla usa segmentos individuales
- Los puntos de entrega se marcan como completados automáticamente cuando el conductor está a menos de 100 metros
- El componente de cobertura está referenciado en rutas pero no implementado

---

## 🐛 Problemas Conocidos

1. **Coverage Component**: Referenciado en `app.routes.ts` pero no existe, causa error de build
2. **API Keys en código**: Deberían estar en variables de entorno
3. **Validación de coordenadas**: Limitada a CDMX, debería ser configurable
4. **Simulación básica**: No considera tráfico real o condiciones de ruta

---

## 📞 Soporte

Para más información sobre las APIs de HERE Maps:
- [HERE Developer Portal](https://developer.here.com/)
- [HERE Maps API Documentation](https://developer.here.com/documentation)
- [HERE Routing API v8](https://developer.here.com/documentation/routing-api/8.16.0/dev_guide/index.html)
- [HERE Geocoding API](https://developer.here.com/documentation/geocoding-search-api/dev_guide/index.html)
