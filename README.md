# HERE Maps - Sistema de Entregas y Rastreo en Tiempo Real

Sistema completo para gestión de entregas con seguimiento en tiempo real, geocercas automáticas, y validación de direcciones usando HERE Maps API.

## 🚀 Características Principales

### Sistema de Entregas en Tiempo Real
- **Seguimiento de Choferes**: Visualización en tiempo real de todos los choferes activos por almacén
- **Geocercas Automáticas**: Detección de proximidad con radio de 200m para notificaciones
- **Rutas Optimizadas**: Cálculo automático de rutas usando HERE Routing API v8
- **Notificaciones**: Sistema de alertas por SMS/Email/WhatsApp
- **WebSocket**: Actualizaciones en tiempo real con latencia < 2 segundos
- **Simulación**: Herramientas de testing con 3 rutas predefinidas

### Gestión de Direcciones
- **Validación Automática**: Geocodificación y validación de direcciones
- **Selección en Mapa**: Corrección manual mediante interfaz interactiva
- **Almacenamiento**: Guardado local de direcciones validadas con coordenadas
- **Análisis de Cobertura**: Visualización de polígonos de cobertura

### Rastreo en Tiempo Real
- **Visualización de ubicación** de conductores en tiempo real
- **Rutas de Entrega**: Seguimiento de progreso en puntos de entrega
- **Geocercas**: Círculos de 200m alrededor de cada punto de entrega
- **ETA Dinámico**: Cálculo automático de tiempo estimado de llegada

## 📋 Documentación Completa

- **[Sistema de Entregas](DELIVERY_TRACKING_SYSTEM.md)** - Guía completa del sistema de entregas
- **[API Documentation](API_DOCUMENTATION.md)** - Referencia completa de endpoints
- **[React Native Implementation](REACT_NATIVE_IMPLEMENTATION.md)** - Integración móvil

## 🛠️ Stack Tecnológico

### Frontend (Angular 18)
- Angular 18 con componentes standalone
- HERE Maps API for JavaScript v3.1
- Socket.IO Client para WebSocket
- RxJS para manejo reactivo de datos
- TypeScript 5.4

### Backend (Node.js/Express)
- Express.js 4.18
- Socket.IO para comunicación en tiempo real
- Geolib para cálculos geoespaciales
- Axios para integración con HERE Maps API
- CORS habilitado

### APIs Externas
- **HERE Maps API**: Mapas, geocodificación, routing
- **HERE Routing API v8**: Cálculo de rutas optimizadas
- **Integración preparada para FultraTrack API**

## 📦 Instalación Rápida

### Prerequisitos
- Node.js v18 o superior
- npm v8 o superior

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Fano117/HERE-MAPS.git
cd HERE-MAPS
```

### 2. Instalar Dependencias

Frontend:
```bash
npm install
```

Backend:
```bash
cd backend
npm install
cd ..
```

## ⚙️ Configuración

### Credenciales HERE Maps
Las credenciales ya están configuradas en el código:

- **App ID**: 7LVwgFjjHhNtTtROLWKD
- **API Key**: GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw

Archivo de configuración: `src/environments/environment.ts`

## 🚀 Ejecución

### Opción 1: Ejecutar Ambos Servicios

Terminal 1 - Backend:
```bash
cd backend
npm start
```
El backend estará disponible en: `http://localhost:3000`

Terminal 2 - Frontend:
```bash
npm start
```
El frontend estará disponible en: `http://localhost:4200`

### Opción 2: Script Unificado
```bash
# Iniciar backend en segundo plano
npm run start:backend &

# Iniciar frontend
npm start
```

## 🎯 Uso del Sistema

### 1. Reportes de Entregas (`/reportes/entregas`)

**Vista Principal del Sistema**

Funcionalidades:
- Selector de almacén (Central, Norte, Sur)
- Lista de choferes activos con estado en tiempo real
- Mapa interactivo mostrando:
  * Posición de choferes (marcadores azules numerados)
  * Rutas calculadas (líneas azules)
  * Geocercas de 200m (círculos semitransparentes)
  * Puntos de entrega (marcadores de colores según estado)
- Panel lateral con:
  * Detalles de entregas pendientes
  * ETA calculado automáticamente
  * Botón para enviar notificación manual

**Iniciar Simulación:**
1. Abrir `/reportes/entregas`
2. Clic en "Iniciar Simulación"
3. El sistema simulará 3 choferes con rutas predefinidas
4. Actualización cada 2 segundos
5. Velocidad: 60 km/h

### 2. Gestión de Direcciones (`/address`)

#### Validación Automática
1. Ingresa una dirección en el campo de texto
2. Presiona "Validar Dirección"
3. Si es correcta: se muestra como válida
4. Si es incorrecta: se muestran sugerencias

#### Ejemplos de Direcciones
- **Correcta**: `PROL CUITLAHUAC, San Martín Centro, San Martín de las Pirámides, Estado de México, 55850, México`
- **Incorrecta**: `S155-CUA James Watt 35, , ,MEX,54730.`

#### Selección Manual en Mapa
1. Haz clic en cualquier punto del mapa
2. El sistema realiza geocodificación reversa
3. Selecciona la dirección sugerida
4. Guarda la dirección con coordenadas

### 3. Rastreo en Tiempo Real (`/tracking`)

#### Configuración del Rastreo
1. Selecciona un conductor del dropdown:
   - Juan Pérez (driver1)
   - María González (driver2)
   - Carlos López (driver3)

2. Presiona "Iniciar Rastreo"
3. El sistema simula movimiento cada 5 segundos

#### Visualización
- **Mapa**: Ubicación actual del conductor (marcador azul)
- **Puntos de Entrega**: Marcadores numerados
  * Rojo: pendiente
  * Verde: completado
- **Información**: Coordenadas, velocidad, dirección
- **Distancias**: Cálculo automático a puntos de entrega

## 📡 API Endpoints

### Rutas de Choferes
- `GET /api/routes/chofer/:choferId` - Obtener ruta
- `POST /api/routes/chofer/:choferId` - Actualizar ruta

### Geocercas
- `POST /api/geofence/check` - Verificar proximidad
- `POST /api/geofence/setup` - Configurar geocercas

### Seguimiento
- `POST /api/tracking/update` - Actualizar ubicación
- `GET /api/tracking/live/:almacenId` - Obtener ubicaciones en vivo

### Notificaciones
- `POST /api/notifications/proximity` - Notificar cliente
- `POST /api/notifications/alert` - Alertar encargado

### Simulación
- `GET /api/simulation/routes` - Obtener rutas predefinidas
- `POST /api/simulation/start` - Iniciar simulación
- `POST /api/simulation/stop/:choferId` - Detener simulación

Ver [API_DOCUMENTATION.md](API_DOCUMENTATION.md) para detalles completos.

## 🔌 WebSocket

### Conexión
```javascript
const socket = io('http://localhost:3000');
```

### Eventos Disponibles
- `chofer_movimiento` - Actualización de posición
- `chofer_geocerca` - Evento de geocerca
- `entrega_completada` - Entrega finalizada
- `notificacion_enviada` - Notificación enviada
- `alerta_embarque` - Alerta para encargado

## 🏗️ Estructura del Proyecto

```
HERE-MAPS/
├── src/ (Angular Frontend - Puerto 4200)
│   ├── app/
│   │   ├── components/
│   │   │   ├── reportes-entregas/      # Sistema principal de entregas
│   │   │   ├── tracking-view/          # Rastreo individual
│   │   │   ├── address-management/     # Gestión de direcciones
│   │   │   └── coverage/               # Análisis de cobertura
│   │   ├── services/
│   │   │   ├── here-maps.service.ts    # Integración HERE Maps
│   │   │   ├── tracking.service.ts     # Seguimiento
│   │   │   ├── websocket.service.ts    # WebSocket
│   │   │   └── address.service.ts      # Direcciones
│   │   └── environments/
│   └── assets/
└── backend/ (Node.js/Express - Puerto 3000)
    ├── controllers/
    │   ├── choferRoutesController.js   # Rutas de choferes
    │   ├── geofenceController.js       # Geocercas
    │   ├── trackingController.js       # Seguimiento tiempo real
    │   ├── notificationsController.js  # Notificaciones
    │   └── simulationController.js     # Simulación
    ├── services/
    │   ├── locationService.js          # Ubicaciones
    │   ├── routeService.js             # Rutas
    │   └── coverageService.js          # Cobertura
    └── server.js                       # Servidor con WebSocket
```

## 🧪 Testing

### Build del Proyecto
```bash
npm run build
```

### Simulación de Rutas
El sistema incluye 3 rutas predefinidas en Ciudad de México:

1. **Ruta Centro - Norte**: Zócalo → Santa María la Ribera (5 puntos)
2. **Ruta Sur - Poniente**: CU → Santa Fe (5 puntos)
3. **Ruta Oriente**: Indios Verdes → Tlatelolco (5 puntos)

### Pruebas con cURL

Verificar geocerca:
```bash
curl -X POST http://localhost:3000/api/geofence/check \
  -H "Content-Type: application/json" \
  -d '{"choferId": 1, "lat": 19.4326, "lng": -99.1332}'
```

Iniciar simulación:
```bash
curl -X POST http://localhost:3000/api/simulation/start \
  -H "Content-Type: application/json" \
  -d '{"choferId": 1, "rutaId": 1, "velocidad": 60}'
```

## 📊 Criterios de Éxito

- ✅ Actualización de mapas en tiempo real (< 2 segundos)
- ✅ Precisión de geocodificación > 95%
- ✅ Detección de geocerca en < 500ms
- ✅ ETA con margen de error < 10%
- ✅ Interfaz responsive (desktop + tablet)
- ✅ Manejo de 50+ choferes simultáneos

## 🔐 Consideraciones de Seguridad

### Desarrollo
- API Keys en código para desarrollo rápido
- CORS abierto para localhost

### Producción (Recomendado)
```bash
# .env
HERE_MAPS_API_KEY=your_key_here
BACKEND_PORT=3000
NODE_ENV=production
```

1. Mover API Keys a variables de entorno
2. Implementar autenticación JWT
3. Configurar CORS restrictivo
4. Usar HTTPS
5. Implementar rate limiting

## 📱 Integración Móvil

Ver [REACT_NATIVE_IMPLEMENTATION.md](REACT_NATIVE_IMPLEMENTATION.md) para integración con FultraApps móvil.

## 🔄 Próximos Pasos

- [ ] Base de datos persistente (MongoDB/PostgreSQL)
- [ ] Autenticación de usuarios
- [ ] Notificaciones push reales (Twilio, SendGrid)
- [ ] Optimización de rutas con HERE Fleet Telematics
- [ ] Dashboard de análitics
- [ ] Integración completa con FultraTrack API

## 🤝 Contribución

Este proyecto es parte del sistema FultraTrack. Para contribuir, contactar al equipo de desarrollo.

## 📄 Licencia

Desarrollado para FultraTrack como sistema de gestión de entregas.

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025  
**Puerto Frontend**: 4200  
**Puerto Backend**: 3000

