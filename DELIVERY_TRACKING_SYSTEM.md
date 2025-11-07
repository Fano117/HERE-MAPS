# Sistema de Seguimiento de Entregas en Tiempo Real - HERE MAPS

Sistema completo de seguimiento de entregas en tiempo real que permite visualización de rutas de choferes asignados por almacén, monitoreo en tiempo real, geocercas automáticas y simulación de rutas para testing.

## 📋 Tabla de Contenidos
- [Características Principales](#características-principales)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso del Sistema](#uso-del-sistema)
- [API Endpoints](#api-endpoints)
- [Componentes Frontend](#componentes-frontend)
- [WebSocket Events](#websocket-events)
- [Testing y Simulación](#testing-y-simulación)

## ✨ Características Principales

### Sistema de Entregas
- ✅ Visualización de rutas de choferes asignados por almacén
- ✅ Monitoreo en tiempo real de entregas
- ✅ Geocercas de 200m para notificaciones automáticas
- ✅ Simulación de rutas para testing
- ✅ Integración preparada para FultraTrack API y FultraApps móvil
- ✅ Actualización de mapas en tiempo real (< 2 segundos de latencia)
- ✅ WebSocket para comunicación bidireccional
- ✅ Sistema de notificaciones (SMS/Email/WhatsApp)

### Tecnologías Utilizadas
- **Frontend**: Angular 18 con componentes standalone
- **Backend**: Node.js/Express con Socket.IO
- **Mapas**: HERE Maps API v3.1
- **Tiempo Real**: WebSocket (Socket.IO)
- **Geolocalización**: Geolib para cálculos de distancia
- **Puertos**: Frontend 4201 | Backend 3000

## 🏗️ Arquitectura del Sistema

```
HERE-MAPS/
├── src/ (Angular Frontend)
│   ├── app/
│   │   ├── components/
│   │   │   ├── reportes-entregas/       # Vista principal de entregas
│   │   │   ├── tracking-view/           # Rastreo individual
│   │   │   ├── address-management/      # Gestión de direcciones
│   │   │   └── coverage/                # Análisis de cobertura
│   │   ├── services/
│   │   │   ├── here-maps.service.ts     # Integración HERE Maps
│   │   │   ├── tracking.service.ts      # Seguimiento de choferes
│   │   │   ├── websocket.service.ts     # Comunicación tiempo real
│   │   │   └── address.service.ts       # Gestión de direcciones
│   │   └── environments/
│   │       ├── environment.ts           # Configuración desarrollo
│   │       └── environment.prod.ts      # Configuración producción
│   └── assets/
└── backend/ (Node.js/Express)
    ├── controllers/
    │   ├── choferRoutesController.js    # Gestión de rutas
    │   ├── geofenceController.js        # Control de geocercas
    │   ├── trackingController.js        # Seguimiento tiempo real
    │   ├── notificationsController.js   # Sistema de notificaciones
    │   └── simulationController.js      # Simulación para testing
    ├── services/
    │   ├── locationService.js           # Ubicaciones
    │   ├── routeService.js              # Rutas
    │   └── coverageService.js           # Cobertura
    └── server.js                        # Servidor principal con WebSocket
```

## 📦 Requisitos

- Node.js v18 o superior
- npm v8 o superior
- Navegador moderno con soporte para WebSocket
- HERE Maps API Key (ya configurada)

## 🚀 Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Fano117/HERE-MAPS.git
cd HERE-MAPS
```

### 2. Instalar Dependencias del Frontend
```bash
npm install
```

### 3. Instalar Dependencias del Backend
```bash
cd backend
npm install
cd ..
```

## ⚙️ Configuración

### Credenciales HERE Maps
Las credenciales ya están configuradas en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  hereMapsApiKey: 'GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw',
  hereMapsAppId: '7LVwgFjjHhNtTtROLWKD',
  backendUrl: 'http://localhost:3000',
  wsUrl: 'ws://localhost:3000',
  geofenceRadius: 200, // metros
  trackingInterval: 30000, // 30 segundos
  simulationSpeed: 60 // km/h
};
```

### Variables de Entorno del Backend
El backend está configurado para usar el puerto 3000 por defecto. Puede modificarse en `backend/server.js`.

## 🎯 Uso del Sistema

### Iniciar el Backend
```bash
cd backend
npm start
```
El backend estará disponible en: `http://localhost:3000`
WebSocket disponible en: `ws://localhost:3000`

### Iniciar el Frontend
```bash
npm start
```
El frontend estará disponible en: `http://localhost:4200`

## 📡 API Endpoints

### Módulo de Rutas de Choferes

#### Obtener ruta de chofer asignado
```http
GET /api/routes/chofer/:choferId
```

**Response:**
```json
{
  "choferId": 1,
  "almacenId": 1,
  "rutaActual": {
    "puntos": [
      {
        "lat": 19.4326,
        "lng": -99.1332,
        "orden": 1,
        "direccion": "Zócalo, Centro Histórico",
        "cliente": "Cliente A"
      }
    ],
    "distanciaTotal": 15000,
    "tiempoEstimado": 45
  },
  "entregas": []
}
```

#### Actualizar ruta de chofer
```http
POST /api/routes/chofer/:choferId
```

**Body:**
```json
{
  "puntos": [
    {"lat": 19.4326, "lng": -99.1332, "direccion": "..."}
  ],
  "recalcular": true
}
```

### Módulo de Geocercas

#### Verificar proximidad a entrega
```http
POST /api/geofence/check
```

**Body:**
```json
{
  "choferId": 1,
  "lat": 19.4326,
  "lng": -99.1332
}
```

**Response:**
```json
{
  "dentroGeocerca": true,
  "distancia": 150,
  "ordenId": "ORD-001",
  "accionRequerida": "notificar_cliente"
}
```

#### Configurar geocercas de entregas
```http
POST /api/geofence/setup
```

**Body:**
```json
{
  "embarqueId": 123,
  "entregas": [
    {
      "ordenId": "ORD-001",
      "lat": 19.4326,
      "lng": -99.1332,
      "radio": 200
    }
  ]
}
```

### Módulo de Seguimiento en Tiempo Real

#### Actualizar ubicación de chofer
```http
POST /api/tracking/update
```

**Body:**
```json
{
  "choferId": 1,
  "lat": 19.4326,
  "lng": -99.1332,
  "timestamp": "2025-11-07T09:00:00.000Z",
  "velocidad": 45,
  "heading": 90
}
```

#### Obtener ubicaciones en tiempo real
```http
GET /api/tracking/live/:almacenId
```

**Response:**
```json
{
  "choferes": [
    {
      "choferId": 1,
      "nombre": "Chofer 1",
      "ubicacionActual": {"lat": 19.4326, "lng": -99.1332},
      "ultimaActualizacion": "2025-11-07T09:00:00.000Z",
      "velocidad": 45,
      "proximaEntrega": {
        "ordenId": "ORD-001",
        "distancia": 500,
        "eta": "2025-11-07T09:15:00.000Z"
      }
    }
  ]
}
```

### Módulo de Notificaciones

#### Enviar notificación de proximidad
```http
POST /api/notifications/proximity
```

**Body:**
```json
{
  "ordenId": "ORD-001",
  "choferId": 1,
  "eta": "2025-11-07T09:15:00.000Z",
  "canal": "sms"
}
```

#### Enviar alerta a encargado
```http
POST /api/notifications/alert
```

**Body:**
```json
{
  "embarqueId": 123,
  "tipo": "fuera_geocerca",
  "choferId": 1,
  "mensaje": "Chofer fuera de ruta"
}
```

### Módulo de Simulación

#### Obtener rutas predefinidas
```http
GET /api/simulation/routes
```

**Response:**
```json
{
  "rutas": [
    {
      "choferId": 1,
      "nombre": "Ruta Centro - Norte",
      "puntos": [...]
    }
  ]
}
```

#### Iniciar simulación
```http
POST /api/simulation/start
```

**Body:**
```json
{
  "choferId": 1,
  "rutaId": 1,
  "velocidad": 60
}
```

#### Detener simulación
```http
POST /api/simulation/stop/:choferId
```

## 🧩 Componentes Frontend

### ReportesEntregasComponent
Vista principal del sistema que muestra:
- Selector de almacén
- Lista de choferes activos con estado
- Mapa HERE Maps con:
  - Posición en tiempo real de choferes (marcadores animados)
  - Rutas calculadas (polylines)
  - Geocercas de 200m (círculos semitransparentes)
  - Puntos de entrega (marcadores con colores según estado)
- Panel lateral con:
  - Detalles de entregas pendientes
  - ETA calculado
  - Botón para enviar notificación manual

**Ruta:** `/reportes/entregas`

## 🔌 WebSocket Events

### Eventos del Cliente al Servidor
- `subscribe_tracking`: Suscribirse a actualizaciones de un almacén
- `unsubscribe_tracking`: Desuscribirse de actualizaciones

### Eventos del Servidor al Cliente
- `chofer_movimiento`: Actualización de posición de chofer
- `chofer_geocerca`: Evento de entrada/salida de geocerca
- `entrega_completada`: Notificación de entrega completada
- `notificacion_enviada`: Confirmación de notificación enviada
- `alerta_embarque`: Alerta para encargado de embarque

## 🧪 Testing y Simulación

### Iniciar Simulación de 3 Choferes
Desde la interfaz de usuario:
1. Abrir `/reportes/entregas`
2. Hacer clic en "Iniciar Simulación"
3. El sistema iniciará 3 rutas concurrentes automáticamente

### Rutas Predefinidas
- **Ruta 1 (Centro - Norte)**: 5 puntos desde Zócalo hasta Santa María la Ribera
- **Ruta 2 (Sur - Poniente)**: 5 puntos desde CU hasta Santa Fe
- **Ruta 3 (Oriente)**: 5 puntos desde Indios Verdes hasta Tlatelolco

### Parámetros de Simulación
- Velocidad: 60 km/h (configurable)
- Intervalo de actualización: 2 segundos
- Radio de geocerca: 200 metros

### Pruebas Manuales con cURL

Verificar geocerca:
```bash
curl -X POST http://localhost:3000/api/geofence/check \
  -H "Content-Type: application/json" \
  -d '{
    "choferId": 1,
    "lat": 19.4326,
    "lng": -99.1332
  }'
```

Actualizar ubicación:
```bash
curl -X POST http://localhost:3000/api/tracking/update \
  -H "Content-Type: application/json" \
  -d '{
    "choferId": 1,
    "lat": 19.4326,
    "lng": -99.1332,
    "velocidad": 45,
    "heading": 90
  }'
```

## 🔧 Casos de Uso

### CU-1: Visualización de Rutas por Almacén
1. Usuario selecciona "Almacén Central"
2. Sistema muestra todos los choferes asignados
3. Mapa muestra rutas del día con geocercas

### CU-2: Alerta de Proximidad
1. FultraApps envía ubicación
2. Sistema detecta distancia < 200m
3. Cliente recibe SMS "Su pedido llegará en 5 minutos"
4. Chofer ve botón "Registrar Entrega"

### CU-3: Chofer Fuera de Ruta
1. Sistema detecta ubicación > 1km del punto esperado
2. Encargado recibe notificación
3. Sistema sugiere recalcular ruta

## 📊 Criterios de Éxito
- ✅ Actualización de mapas en tiempo real (< 2 segundos de latencia)
- ✅ Precisión de geocodificación > 95%
- ✅ Detección de geocerca en < 500ms
- ✅ ETA con margen de error < 10%
- ✅ Interfaz responsive (desktop + tablet)
- ✅ Manejo de 50+ choferes simultáneos sin degradación

## 🛠️ Desarrollo

### Build del Frontend
```bash
npm run build
```

### Modo Desarrollo con Watch
```bash
npm run dev
```

### Estructura de Datos

**Chofer Location:**
```typescript
interface ChoferLocation {
  choferId: number;
  lat: number;
  lng: number;
  timestamp: string;
  velocidad?: number;
  heading?: number;
}
```

**Entrega:**
```typescript
interface Entrega {
  ordenId: string;
  cliente: string;
  direccion: string;
  coordenadas: { lat: number; lng: number };
  estado: 'pendiente' | 'en_curso' | 'completada';
  eta?: string;
}
```

## 🔐 Seguridad

**Nota Importante**: En producción, las API keys deben moverse a variables de entorno:

```bash
# .env
HERE_MAPS_API_KEY=your_key_here
BACKEND_PORT=3000
```

## 📝 Licencia

Este proyecto está desarrollado para FultraTrack como sistema de gestión de entregas.

## 👥 Soporte

Para soporte técnico o preguntas, contactar al equipo de desarrollo de FultraTrack.

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025
