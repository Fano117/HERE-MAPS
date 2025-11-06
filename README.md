# HERE Maps - Gestión de Direcciones y Rastreo

Sistema completo para gestión de direcciones con validación automática y rastreo en tiempo real usando HERE Maps API.

## Características

### Frontend (Angular 20)
- **Gestión de Direcciones**: Validación automática de direcciones ingresadas
- **Selección en Mapa**: Corrección manual de direcciones mediante interfaz de mapa interactivo
- **Almacenamiento**: Guardado local de direcciones validadas con coordenadas
- **Rastreo en Tiempo Real**: Visualización de ubicación de conductores en tiempo real
- **Rutas de Entrega**: Seguimiento de progreso en puntos de entrega

### Backend (Express.js)
- **Simulación de Rastreo**: API para simular movimiento de conductores
- **Endpoints RESTful**: GET/POST para manejo de ubicaciones y rutas
- **Datos Dummy**: Sistema de simulación con rutas predefinidas

## Instalación

### Prerequisitos
- Node.js (v18 o superior)
- npm

### 1. Instalar dependencias del Frontend

```bash
npm install
```

### 2. Instalar dependencias del Backend

```bash
cd backend
npm install
cd ..
```

## Configuración

### Credenciales HERE Maps
Las credenciales ya están configuradas en el código:

- **App ID**: 7LVwgFjjHhNtTtROLWKD
- **API Key**: GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw

### Archivos de Configuración
- `src/app/services/here-maps.service.ts`: Configuración del API Key
- `backend/config.js`: Configuración del backend

## Ejecución

### Iniciar Frontend (Angular)
```bash
npm start
```
El frontend estará disponible en: `http://localhost:4200`

### Iniciar Backend (Express.js)
```bash
npm run start:backend
```
El backend estará disponible en: `http://localhost:3000`

## Uso

### 1. Gestión de Direcciones (`/address`)

#### Validación Automática
1. Ingresa una dirección en el campo de texto
2. Presiona "Validar Dirección"
3. Si es correcta: se muestra como válida
4. Si es incorrecta: se muestran sugerencias

#### Ejemplos de Direcciones
- **Correcta**: `PROL CUITLAHUAC, San Martín Centro, San Martín de las Pirámides, Estado de México, 55850, México`
- **Incorrecta**: `S155-CUA James Watt 35, , ,MEX,54730.`

#### Selección Manual en Mapa
1. Haz clic en cualquier punto del mapa para obtener la dirección
2. El sistema realizará geocodificación reversa
3. Selecciona la dirección sugerida
4. Guarda la dirección con coordenadas

#### Gestión de Direcciones Guardadas
- Ver lista de direcciones almacenadas
- Visualizar en mapa
- Eliminar direcciones

### 2. Rastreo en Tiempo Real (`/tracking`)

#### Configuración del Rastreo
1. Selecciona un conductor del dropdown:
   - Juan Pérez (driver1)
   - María González (driver2)
   - Carlos López (driver3)

2. Presiona "Iniciar Rastreo"
3. El sistema comenzará a simular movimiento cada 5 segundos

#### Visualización
- **Mapa**: Muestra ubicación actual del conductor (marcador azul)
- **Puntos de Entrega**: Marcadores numerados (rojo: pendiente, verde: completado)
- **Información**: Coordenadas, velocidad, dirección actual
- **Distancias**: Cálculo automático a puntos de entrega

#### Estados de Entrega
- Los puntos se marcan como completados automáticamente cuando el conductor está a menos de 100m
- Visualización del progreso de la ruta

## API Endpoints del Backend

### Ubicaciones
- `GET /api/location/:driverId` - Obtener ubicación actual
- `POST /api/location/:driverId` - Actualizar ubicación manual

### Rutas
- `GET /api/routes/:driverId` - Obtener ruta del conductor
- `POST /api/routes/:driverId` - Actualizar ruta de entrega

### Simulación
- `GET /api/simulation/start/:driverId` - Iniciar simulación automática
- `GET /api/simulation/stop/:driverId` - Detener simulación

## Estructura del Proyecto

```
here-maps-angular/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── address-management/
│   │   │   └── tracking-view/
│   │   └── services/
│   │       ├── here-maps.service.ts
│   │       └── address.service.ts
│   └── ...
├── backend/
│   ├── services/
│   │   ├── locationService.js
│   │   └── routeService.js
│   ├── server.js
│   └── config.js
└── REACT_NATIVE_IMPLEMENTATION.md
```

## Implementación en React Native

Ver el archivo `REACT_NATIVE_IMPLEMENTATION.md` para instrucciones detalladas sobre cómo implementar el sistema en React Native usando HERE SDK.

### Funcionalidades para Móvil
- Recepción de coordenadas desde la aplicación Angular
- Visualización de puntos de entrega en mapa nativo
- Rastreo GPS del dispositivo móvil
- Sincronización en tiempo real con el backend

## Consideraciones Técnicas

### Frontend
- Angular 20 con sintaxis moderna
- Componentes standalone
- Servicios reactivos con RxJS
- Almacenamiento local con localStorage

### Backend
- Express.js con simulación de datos
- Endpoints RESTful siguiendo estándares
- Simulación de rutas con interpolación de coordenadas
- Manejo de múltiples conductores simultáneos

### HERE Maps Integration
- Geocodificación directa e inversa
- Validación automática de direcciones
- Mapas interactivos con marcadores
- Cálculo de distancias y rutas

## Mejores Prácticas Implementadas

1. **Arquitectura Modular**: Separación clara entre servicios y componentes
2. **Manejo de Errores**: Validación y mensajes informativos al usuario
3. **Responsividad**: Interfaz adaptable a diferentes tamaños de pantalla
4. **Performance**: Actualizaciones eficientes del mapa y marcadores
5. **UX/UI**: Interfaz intuitiva con feedback visual claro

## Próximos Pasos

Para implementación en producción:

1. **Seguridad**: Mover API Keys a variables de entorno
2. **Base de Datos**: Implementar persistencia real (MongoDB/PostgreSQL)
3. **Autenticación**: Sistema de login para conductores y administradores
4. **Notificaciones**: Push notifications para eventos importantes
5. **Optimizaciones**: Cache de direcciones y optimización de consultas
