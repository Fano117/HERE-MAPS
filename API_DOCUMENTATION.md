# API Documentation - HERE MAPS Delivery Tracking System

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently no authentication is required (development mode). In production, implement JWT or API key authentication.

---

## Endpoints

### 📍 Route Management

#### Get Driver Route
Get the current route assigned to a specific driver.

**Endpoint:** `GET /routes/chofer/:choferId`

**Parameters:**
- `choferId` (path) - Driver ID

**Response:** `200 OK`
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

#### Update Driver Route
Update or recalculate a driver's route.

**Endpoint:** `POST /routes/chofer/:choferId`

**Parameters:**
- `choferId` (path) - Driver ID

**Request Body:**
```json
{
  "puntos": [
    {
      "lat": 19.4326,
      "lng": -99.1332,
      "direccion": "Dirección completa",
      "cliente": "Nombre del cliente"
    }
  ],
  "recalcular": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "route": {
    "choferId": 1,
    "rutaActual": {
      "puntos": [...],
      "distanciaTotal": 15000,
      "tiempoEstimado": 45
    }
  }
}
```

**Errors:**
- `400 Bad Request` - Invalid points array
- `500 Internal Server Error` - Route calculation failed

---

### 🎯 Geofence Management

#### Check Geofence Proximity
Verify if a driver is within the geofence of any delivery point.

**Endpoint:** `POST /geofence/check`

**Request Body:**
```json
{
  "choferId": 1,
  "lat": 19.4326,
  "lng": -99.1332
}
```

**Response:** `200 OK`
```json
{
  "dentroGeocerca": true,
  "distancia": 150,
  "ordenId": "ORD-001",
  "accionRequerida": "notificar_cliente"
}
```

**Action Types:**
- `"notificar_cliente"` - Within 200m, send customer notification
- `"habilitar_entrega"` - Within 100m, enable delivery button
- `null` - Outside geofence

**Errors:**
- `400 Bad Request` - Missing required parameters
- `500 Internal Server Error` - Calculation error

#### Setup Geofences
Configure geofences for a shipment's deliveries.

**Endpoint:** `POST /geofence/setup`

**Request Body:**
```json
{
  "embarqueId": 123,
  "entregas": [
    {
      "ordenId": "ORD-001",
      "lat": 19.4326,
      "lng": -99.1332,
      "radio": 200
    },
    {
      "ordenId": "ORD-002",
      "lat": 19.4284,
      "lng": -99.1276,
      "radio": 200
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "embarqueId": 123,
  "geocercasCreadas": 2
}
```

**Errors:**
- `400 Bad Request` - Invalid entregas array
- `500 Internal Server Error` - Setup failed

---

### 📡 Real-Time Tracking

#### Update Driver Location
Update a driver's current location. This triggers WebSocket events to connected clients.

**Endpoint:** `POST /tracking/update`

**Request Body:**
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

**Response:** `200 OK`
```json
{
  "success": true,
  "location": {
    "choferId": 1,
    "lat": 19.4326,
    "lng": -99.1332,
    "timestamp": "2025-11-07T09:00:00.000Z",
    "velocidad": 45,
    "heading": 90
  }
}
```

**WebSocket Event Emitted:**
```json
{
  "event": "chofer_movimiento",
  "data": {
    "choferId": 1,
    "lat": 19.4326,
    "lng": -99.1332,
    "timestamp": "2025-11-07T09:00:00.000Z",
    "velocidad": 45,
    "heading": 90
  }
}
```

**Errors:**
- `400 Bad Request` - Missing choferId, lat, or lng
- `500 Internal Server Error` - Update failed

#### Get Live Tracking
Get real-time locations of all active drivers in a warehouse.

**Endpoint:** `GET /tracking/live/:almacenId`

**Parameters:**
- `almacenId` (path) - Warehouse ID

**Response:** `200 OK`
```json
{
  "choferes": [
    {
      "choferId": 1,
      "nombre": "Chofer 1",
      "ubicacionActual": {
        "lat": 19.4326,
        "lng": -99.1332
      },
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

**Errors:**
- `500 Internal Server Error` - Retrieval failed

---

### 🔔 Notifications

#### Send Proximity Notification
Send a notification to a customer when driver is approaching.

**Endpoint:** `POST /notifications/proximity`

**Request Body:**
```json
{
  "ordenId": "ORD-001",
  "choferId": 1,
  "eta": "2025-11-07T09:15:00.000Z",
  "canal": "sms"
}
```

**Channels:**
- `"sms"` - SMS notification
- `"email"` - Email notification
- `"whatsapp"` - WhatsApp notification

**Response:** `200 OK`
```json
{
  "success": true,
  "notificationId": 1,
  "mensaje": "Notificación sms enviada para orden ORD-001"
}
```

**Errors:**
- `400 Bad Request` - Missing ordenId or choferId
- `500 Internal Server Error` - Notification failed

#### Send Alert Notification
Send an alert to the shipment manager.

**Endpoint:** `POST /notifications/alert`

**Request Body:**
```json
{
  "embarqueId": 123,
  "tipo": "fuera_geocerca",
  "choferId": 1,
  "mensaje": "Chofer fuera de ruta establecida"
}
```

**Alert Types:**
- `"fuera_geocerca"` - Driver outside geofence
- `"retraso"` - Delivery delay
- `"incidencia"` - General incident

**Response:** `200 OK`
```json
{
  "success": true,
  "notificationId": 2,
  "mensaje": "Alerta enviada para embarque 123"
}
```

**Errors:**
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Alert failed

#### Get Notification History
Retrieve recent notification history.

**Endpoint:** `GET /notifications/history`

**Response:** `200 OK`
```json
{
  "total": 50,
  "notificaciones": [
    {
      "tipo": "proximidad",
      "ordenId": "ORD-001",
      "choferId": 1,
      "eta": "2025-11-07T09:15:00.000Z",
      "canal": "sms",
      "timestamp": "2025-11-07T09:00:00.000Z",
      "estado": "pendiente"
    }
  ]
}
```

---

### 🎮 Simulation

#### Get Simulation Routes
Get predefined routes for testing.

**Endpoint:** `GET /simulation/routes`

**Response:** `200 OK`
```json
{
  "rutas": [
    {
      "choferId": 1,
      "nombre": "Ruta Centro - Norte",
      "puntos": [
        {
          "lat": 19.4326,
          "lng": -99.1332,
          "direccion": "Zócalo, Centro Histórico",
          "cliente": "Cliente A"
        }
      ]
    }
  ]
}
```

#### Start Simulation
Start route simulation for a driver.

**Endpoint:** `POST /simulation/start`

**Request Body:**
```json
{
  "choferId": 1,
  "rutaId": 1,
  "velocidad": 60
}
```

**Parameters:**
- `choferId` - Driver to simulate
- `rutaId` - Predefined route ID (1-3)
- `velocidad` - Speed in km/h (optional, default: 60)

**Response:** `200 OK`
```json
{
  "success": true,
  "mensaje": "Simulación iniciada",
  "choferId": 1,
  "ruta": "Ruta Centro - Norte",
  "velocidad": 60,
  "puntos": 5
}
```

**WebSocket Events:**
During simulation, the following events are emitted every 2 seconds:
- `chofer_movimiento` - Position updates
- `chofer_punto_alcanzado` - Waypoint reached

**Errors:**
- `400 Bad Request` - Simulation already active or missing choferId
- `404 Not Found` - Route not found
- `500 Internal Server Error` - Simulation failed

#### Stop Simulation
Stop active simulation for a driver.

**Endpoint:** `POST /simulation/stop/:choferId`

**Parameters:**
- `choferId` (path) - Driver ID

**Response:** `200 OK`
```json
{
  "success": true,
  "mensaje": "Simulación detenida",
  "choferId": 1
}
```

**Errors:**
- `404 Not Found` - No active simulation
- `500 Internal Server Error` - Stop failed

---

## WebSocket API

### Connection
```javascript
const socket = io('http://localhost:3000');
```

### Client Events (Send)

#### Subscribe to Tracking
```javascript
socket.emit('subscribe_tracking', {
  almacenId: 1
});
```

#### Unsubscribe from Tracking
```javascript
socket.emit('unsubscribe_tracking', {
  almacenId: 1
});
```

### Server Events (Receive)

#### Driver Movement
```javascript
socket.on('chofer_movimiento', (data) => {
  // data: { choferId, lat, lng, timestamp, velocidad, heading }
});
```

#### Geofence Event
```javascript
socket.on('chofer_geocerca', (data) => {
  // data: { choferId, ordenId, accion }
});
```

#### Delivery Completed
```javascript
socket.on('entrega_completada', (data) => {
  // data: { choferId, ordenId }
});
```

#### Notification Sent
```javascript
socket.on('notificacion_enviada', (data) => {
  // data: { tipo, ordenId, choferId, canal, timestamp }
});
```

#### Shipment Alert
```javascript
socket.on('alerta_embarque', (data) => {
  // data: { tipo, subtipo, embarqueId, choferId, mensaje, timestamp }
});
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Bad Request - Invalid parameters |
| 404  | Not Found - Resource doesn't exist |
| 500  | Internal Server Error |

## Rate Limiting
Currently no rate limiting is implemented. In production, consider implementing rate limiting for API endpoints.

## CORS
Allowed origins:
- `http://localhost:4200`
- `http://localhost:4201`

## Data Types

### Coordinates
```typescript
{
  lat: number,  // Latitude (-90 to 90)
  lng: number   // Longitude (-180 to 180)
}
```

### Timestamp
ISO 8601 format: `2025-11-07T09:00:00.000Z`

### Estados de Entrega
- `"pendiente"` - Pending delivery
- `"en_curso"` - In progress
- `"completada"` - Completed

---

## Testing with cURL

### Check Geofence
```bash
curl -X POST http://localhost:3000/api/geofence/check \
  -H "Content-Type: application/json" \
  -d '{
    "choferId": 1,
    "lat": 19.4326,
    "lng": -99.1332
  }'
```

### Update Location
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

### Start Simulation
```bash
curl -X POST http://localhost:3000/api/simulation/start \
  -H "Content-Type: application/json" \
  -d '{
    "choferId": 1,
    "rutaId": 1,
    "velocidad": 60
  }'
```

---

**Version:** 1.0.0  
**Last Updated:** November 2025
