# Ejemplos de Uso - Tecnología de Navegación HERE Maps

Este documento proporciona ejemplos prácticos de las capacidades de navegación y mapas que ofrece la tecnología HERE Maps implementada en este proyecto.

---

## 📚 Tabla de Contenidos

1. [Validación de Direcciones](#validación-de-direcciones)
2. [Geocodificación](#geocodificación)
3. [Rastreo en Tiempo Real](#rastreo-en-tiempo-real)
4. [Optimización de Rutas](#optimización-de-rutas)
5. [Análisis de Cobertura](#análisis-de-cobertura)
6. [Casos de Uso Avanzados](#casos-de-uso-avanzados)

---

## 🔍 Validación de Direcciones

### Ejemplo 1: Validar una Dirección Completa

**Caso de uso:** Verificar si una dirección ingresada por el usuario es válida antes de enviar un paquete.

**Dirección de entrada:**
```
PROL CUITLAHUAC, San Martín Centro, San Martín de las Pirámides, Estado de México, 55850, México
```

**Pasos:**
1. Navega a `/address`
2. Ingresa la dirección en el campo de texto
3. Haz clic en "Validar Dirección"

**Resultado esperado:**
- ✅ La dirección es válida
- Se muestra la dirección normalizada
- Se obtienen coordenadas exactas: `lat: 19.6884, lng: -98.8428`
- Se muestra en el mapa

**Código equivalente:**
```typescript
const result = await hereMapsService.validateAddress(
  'PROL CUITLAHUAC, San Martín Centro, San Martín de las Pirámides, Estado de México, 55850, México'
);

console.log(result.isValid); // true
console.log(result.suggestions[0].coordinates); // { lat: 19.6884, lng: -98.8428 }
```

---

### Ejemplo 2: Dirección Incompleta con Sugerencias

**Caso de uso:** El usuario ingresa una dirección incompleta o ambigua.

**Dirección de entrada:**
```
Av Insurgentes Sur 1234
```

**Pasos:**
1. Navega a `/address`
2. Ingresa la dirección parcial
3. Haz clic en "Validar Dirección"

**Resultado esperado:**
- ⚠️ La dirección no es exacta
- Se muestran múltiples sugerencias:
  - "Av Insurgentes Sur 1234, Del Valle, CDMX"
  - "Av Insurgentes Sur 1234, Tlalpan, CDMX"
  - "Av Insurgentes Sur 1234, Benito Juárez, CDMX"
- Puedes seleccionar la correcta

**Código equivalente:**
```typescript
const result = await hereMapsService.validateAddress('Av Insurgentes Sur 1234');

console.log(result.isValid); // false (no es exacta)
console.log(result.suggestions.length); // 3+ sugerencias
result.suggestions.forEach(s => console.log(s.label));
```

---

## 🗺️ Geocodificación

### Ejemplo 3: Geocodificación Directa (Dirección → Coordenadas)

**Caso de uso:** Convertir una dirección de texto a coordenadas geográficas para mostrar en un mapa.

**Dirección:**
```
Paseo de la Reforma 222, Juárez, Cuauhtémoc, Ciudad de México, CDMX, 06600
```

**Código:**
```typescript
const addresses = await hereMapsService.geocodeAddress(
  'Paseo de la Reforma 222, Juárez, Cuauhtémoc, Ciudad de México'
);

const firstResult = addresses[0];
console.log(firstResult.label); // "Paseo de la Reforma 222..."
console.log(firstResult.coordinates); // { lat: 19.4261, lng: -99.1718 }
console.log(firstResult.postalCode); // "06600"
```

**Resultado:**
- Coordenadas: `19.4261, -99.1718`
- La dirección se puede mostrar en el mapa
- Se obtienen detalles completos: calle, número, colonia, ciudad, código postal

---

### Ejemplo 4: Geocodificación Inversa (Coordenadas → Dirección)

**Caso de uso:** El usuario hace clic en el mapa y quiere saber qué dirección corresponde a ese punto.

**Coordenadas:**
```
lat: 19.4326, lng: -99.1332
```

**Pasos:**
1. Navega a `/address`
2. Haz clic en cualquier punto del mapa
3. El sistema ejecuta geocodificación inversa automáticamente

**Código equivalente:**
```typescript
const address = await hereMapsService.reverseGeocode(19.4326, -99.1332);

console.log(address.label); 
// "Av. Juárez, Centro Histórico, Cuauhtémoc, Ciudad de México, 06010"

console.log(address.street); // "Av. Juárez"
console.log(address.district); // "Centro Histórico"
console.log(address.city); // "Ciudad de México"
console.log(address.postalCode); // "06010"
```

**Aplicación práctica:**
- Seleccionar ubicaciones precisas en el mapa
- Obtener direcciones de puntos GPS
- Validar coordenadas de dispositivos móviles

---

## 📍 Rastreo en Tiempo Real

### Ejemplo 5: Rastrear un Conductor

**Caso de uso:** Monitorear la ubicación en tiempo real de un conductor de reparto.

**Pasos:**
1. Navega a `/tracking`
2. Selecciona "Juan Pérez (driver1)" del dropdown
3. Haz clic en "Iniciar Rastreo"

**Resultado:**
- El mapa se actualiza cada 5 segundos
- Se muestra la ubicación actual del conductor
- Se calcula la distancia a cada punto de entrega
- Se muestra la dirección actual mediante geocodificación inversa
- Los puntos de entrega se marcan como completados cuando el conductor está a menos de 100m

**Código equivalente:**
```typescript
// Iniciar rastreo
const startResponse = await fetch('http://localhost:3000/api/simulation/start/driver1');

// Obtener ubicación actual (cada 5 segundos)
setInterval(async () => {
  const response = await fetch('http://localhost:3000/api/location/driver1');
  const location = await response.json();
  
  console.log('Ubicación actual:', location.coordinates);
  console.log('Velocidad:', location.speed, 'km/h');
  console.log('Dirección:', location.heading);
  
  // Actualizar marcador en el mapa
  updateDriverMarker(location.coordinates);
  
  // Obtener dirección
  const address = await hereMapsService.reverseGeocode(
    location.coordinates.lat, 
    location.coordinates.lng
  );
  console.log('Dirección actual:', address.label);
}, 5000);
```

---

### Ejemplo 6: Múltiples Conductores

**Caso de uso:** Rastrear varios conductores simultáneamente.

**Conductores disponibles:**
- Juan Pérez (driver1) - Ruta predefinida por CDMX Norte
- María González (driver2) - Ruta predefinida por CDMX Sur
- Carlos López (driver3) - Ruta predefinida por CDMX Centro

**Código para rastrear múltiples:**
```typescript
const drivers = ['driver1', 'driver2', 'driver3'];

drivers.forEach(async (driverId) => {
  // Iniciar simulación
  await fetch(`http://localhost:3000/api/simulation/start/${driverId}`);
  
  // Rastrear
  setInterval(async () => {
    const response = await fetch(`http://localhost:3000/api/location/${driverId}`);
    const location = await response.json();
    updateDriverMarkerOnMap(driverId, location);
  }, 5000);
});
```

---

## 🛣️ Optimización de Rutas

### Ejemplo 7: Calcular Ruta Optimizada para Múltiples Entregas

**Caso de uso:** Un conductor tiene 5 entregas que hacer. Calcular la ruta más eficiente.

**Pasos:**
1. Navega a `/address`
2. Define tu punto de partida (clic en "Punto de Partida" en una dirección guardada)
3. Agrega las 5 direcciones de entrega
4. Haz clic en "Calcular Ruta Óptima"

**Direcciones de ejemplo:**
```
Punto de partida:
- Av. Insurgentes Sur 2000, CDMX (19.3733, -99.1792)

Entregas:
1. Av. Reforma 222, CDMX (19.4261, -99.1718)
2. Av. Universidad 1000, CDMX (19.3231, -99.1777)
3. Av. Constituyentes 900, CDMX (19.4084, -99.2039)
4. Calzada de Tlalpan 1900, CDMX (19.3537, -99.1656)
5. Av. División del Norte 2800, CDMX (19.3418, -99.1625)
```

**Resultado:**
- ✅ Ruta optimizada calculada con HERE Routing API
- Distancia total: ~45 km
- Tiempo estimado: ~90 minutos
- Visualización de la ruta completa en el mapa
- Polilínea mostrando el camino exacto
- Regreso al punto de partida incluido

**Código equivalente:**
```typescript
const startPoint = { lat: 19.3733, lng: -99.1792 };
const waypoints = [
  { lat: 19.4261, lng: -99.1718 },
  { lat: 19.3231, lng: -99.1777 },
  { lat: 19.4084, lng: -99.2039 },
  { lat: 19.3537, lng: -99.1656 },
  { lat: 19.3418, lng: -99.1625 }
];

const route = await hereMapsService.calculateOptimizedRoute(startPoint, waypoints);

console.log('Distancia total:', route.summary.length / 1000, 'km');
console.log('Tiempo estimado:', route.summary.duration / 60, 'minutos');

// Decodificar polyline para visualizar
const routePoints = hereMapsService.decodePolyline(route.sections[0].polyline);
console.log('Puntos de la ruta:', routePoints.length);

// Dibujar en el mapa
drawRouteOnMap(routePoints);
```

---

### Ejemplo 8: Ruta Simple Punto a Punto

**Caso de uso:** Calcular la ruta más rápida entre dos puntos.

**Código:**
```typescript
const origin = { lat: 19.4326, lng: -99.1332 }; // Zócalo
const destination = { lat: 19.4261, lng: -99.1718 }; // Reforma

const route = await hereMapsService.calculateRoute(origin, destination);

console.log('Distancia:', route.sections[0].summary.length, 'metros');
console.log('Duración:', route.sections[0].summary.duration, 'segundos');
console.log('Polyline:', route.sections[0].polyline);

// Decodificar y dibujar
const points = hereMapsService.decodePolyline(route.sections[0].polyline);
const lineString = new H.geo.LineString();
points.forEach(p => lineString.pushPoint(p));

const routeLine = new H.map.Polyline(lineString, {
  style: { strokeColor: 'blue', lineWidth: 4 }
});
map.addObject(routeLine);
```

**Resultado:**
- Distancia: ~4.2 km
- Duración: ~12 minutos (sin tráfico)
- Ruta dibujada en azul en el mapa

---

## 🎯 Análisis de Cobertura

### Ejemplo 9: Crear Área de Cobertura

**Caso de uso:** Definir una zona geográfica donde tu empresa ofrece servicio de entrega.

**Pasos:**
1. Navega a `/coverage`
2. Haz clic en "Crear Nuevo Polígono"
3. Ingresa el nombre: "Zona Centro CDMX"
4. Haz clic en el mapa para definir los puntos del polígono (mínimo 3)
5. Haz clic en "Finalizar Polígono"

**Ejemplo de polígono para Zona Centro:**
```typescript
const zonaCentro = {
  name: "Zona Centro CDMX",
  coordinates: [
    { lat: 19.4400, lng: -99.1450 },
    { lat: 19.4400, lng: -99.1200 },
    { lat: 19.4200, lng: -99.1200 },
    { lat: 19.4200, lng: -99.1450 }
  ]
};
```

**Resultado:**
- Polígono azul semitransparente dibujado en el mapa
- Área guardada en el backend
- Disponible para análisis de puntos

---

### Ejemplo 10: Verificar si una Dirección está en Cobertura

**Caso de uso:** Un cliente quiere ordenar algo y necesitas verificar si entregas en su ubicación.

**Pasos:**
1. Navega a `/coverage`
2. Asegúrate de tener al menos un polígono creado
3. Haz clic en cualquier punto del mapa

**Código equivalente:**
```typescript
// Verificar punto
const result = await polygonAnalysisService.analyzeMapPoint(19.4326, -99.1332);

if (result.status === 'inside') {
  console.log('✅ Entregamos en esta área');
  console.log('Área:', result.result.name);
} else if (result.status === 'outside') {
  console.log('❌ No entregamos en esta área');
  console.log('Distancia al área más cercana:', result.distance, 'metros');
} else {
  console.log('ℹ️ No hay áreas de cobertura definidas');
}
```

**Resultado visual:**
- Marcador morado en el punto analizado
- Mensaje verde si está dentro
- Mensaje rojo si está fuera
- Distancia calculada al área más cercana

---

## 🚀 Casos de Uso Avanzados

### Ejemplo 11: Sistema Completo de Entregas

**Escenario:** Una empresa de logística que gestiona entregas en Ciudad de México.

**Flujo completo:**

```typescript
// 1. Validar y guardar direcciones de clientes
const customerAddresses = [
  'Av. Insurgentes Sur 1234, CDMX',
  'Paseo de la Reforma 500, CDMX',
  'Av. Universidad 2000, CDMX'
];

const validatedAddresses = [];
for (const addr of customerAddresses) {
  const result = await hereMapsService.validateAddress(addr);
  if (result.isValid) {
    validatedAddresses.push(result.suggestions[0]);
  }
}

// 2. Verificar que todas están en área de cobertura
for (const addr of validatedAddresses) {
  const coverage = await polygonAnalysisService.analyzeAddressPoint(
    addr.coordinates.lat,
    addr.coordinates.lng,
    addr.label
  );
  
  if (coverage.status !== 'inside') {
    console.warn(`⚠️ ${addr.label} está fuera de cobertura`);
  }
}

// 3. Calcular ruta optimizada
const warehouse = { lat: 19.4326, lng: -99.1332 };
const route = await hereMapsService.calculateOptimizedRoute(
  warehouse,
  validatedAddresses.map(a => a.coordinates)
);

console.log(`Ruta de ${validatedAddresses.length} entregas:`);
console.log(`- Distancia total: ${route.summary.length / 1000} km`);
console.log(`- Tiempo estimado: ${route.summary.duration / 60} minutos`);

// 4. Asignar a conductor
await fetch('http://localhost:3000/api/routes/driver1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deliveries: validatedAddresses
  })
});

// 5. Iniciar rastreo
await fetch('http://localhost:3000/api/simulation/start/driver1');

// 6. Monitorear progreso
setInterval(async () => {
  const location = await fetch('http://localhost:3000/api/location/driver1')
    .then(r => r.json());
  
  // Calcular distancias a cada punto de entrega
  validatedAddresses.forEach((addr, index) => {
    const distance = calculateDistance(location.coordinates, addr.coordinates);
    
    if (distance < 100) {
      console.log(`✅ Entrega ${index + 1} completada`);
    } else {
      console.log(`📦 Entrega ${index + 1}: ${distance}m restantes`);
    }
  });
}, 5000);
```

---

### Ejemplo 12: Análisis de Direcciones Problemáticas

**Caso de uso:** Identificar direcciones que los conductores reportan como difíciles de encontrar.

**Código:**
```typescript
// Obtener direcciones problemáticas del backend
const response = await fetch('http://localhost:3000/api/addresses/problematic');
const problematicAddresses = await response.json();

console.log('Direcciones problemáticas:', problematicAddresses.length);

// Para cada una, obtener información adicional
for (const addr of problematicAddresses) {
  // Re-validar con HERE Maps
  const validation = await hereMapsService.validateAddress(addr.address);
  
  if (!validation.isValid) {
    console.log(`❌ Dirección inválida: ${addr.address}`);
    console.log('Sugerencias:', validation.suggestions.map(s => s.label));
  }
  
  // Verificar cobertura
  const coverage = await polygonAnalysisService.analyzeAddressPoint(
    addr.coordinates.lat,
    addr.coordinates.lng
  );
  
  if (coverage.status === 'outside') {
    console.log(`⚠️ Fuera de cobertura: ${addr.address}`);
  }
}
```

---

### Ejemplo 13: Calcular Distancias Entre Puntos

**Caso de uso:** Determinar la distancia entre el conductor y todos los puntos de entrega.

**Código:**
```typescript
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

// Uso
const driverLocation = { lat: 19.4326, lng: -99.1332 };
const deliveryPoints = [
  { lat: 19.4261, lng: -99.1718 },
  { lat: 19.3231, lng: -99.1777 },
  { lat: 19.4084, lng: -99.2039 }
];

deliveryPoints.forEach((point, index) => {
  const distance = calculateDistance(driverLocation, point);
  console.log(`Distancia al punto ${index + 1}: ${distance.toFixed(0)} metros`);
});
```

---

### Ejemplo 14: Integración con React Native

**Caso de uso:** La app móvil del conductor recibe las coordenadas de las entregas desde el sistema web.

**En React Native:**
```typescript
import { HEREMap, MapMarker, MapPolyline } from '@here/react-native-here-sdk';

// Recibir datos del backend
const deliveryRoute = await fetch('http://localhost:3000/api/routes/driver1')
  .then(r => r.json());

// Mostrar en mapa nativo
<HEREMap
  apiKey="GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw"
  center={{ lat: 19.4326, lng: -99.1332 }}
  zoom={12}
>
  {/* Marcadores de entregas */}
  {deliveryRoute.deliveries.map((delivery, index) => (
    <MapMarker
      key={index}
      coordinate={delivery.coordinates}
      title={`Entrega ${index + 1}`}
      description={delivery.label}
    />
  ))}
  
  {/* Ubicación del conductor */}
  <MapMarker
    coordinate={driverLocation}
    title="Tu ubicación"
    pinColor="blue"
  />
</HEREMap>

// Usar GPS del dispositivo
navigator.geolocation.watchPosition(
  (position) => {
    const location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    
    // Enviar al backend
    fetch('http://localhost:3000/api/location/driver1', {
      method: 'POST',
      body: JSON.stringify({ coordinates: location })
    });
  },
  (error) => console.error(error),
  { enableHighAccuracy: true, distanceFilter: 10 }
);
```

---

## 💡 Mejores Prácticas

### 1. Validación de Direcciones
```typescript
// ✅ Buena práctica: Siempre valida antes de guardar
const validation = await hereMapsService.validateAddress(userInput);
if (validation.isValid) {
  saveAddress(validation.suggestions[0]);
} else {
  showSuggestions(validation.suggestions);
}

// ❌ Mala práctica: Guardar sin validar
saveAddress(userInput); // Puede causar errores de geocodificación
```

### 2. Manejo de Errores
```typescript
// ✅ Buena práctica: Manejar errores de API
try {
  const route = await hereMapsService.calculateRoute(origin, destination);
  displayRoute(route);
} catch (error) {
  console.error('Error calculando ruta:', error);
  showUserFriendlyError('No se pudo calcular la ruta. Intenta de nuevo.');
}
```

### 3. Optimización de Llamadas a API
```typescript
// ✅ Buena práctica: Usar debounce para búsquedas
const debouncedSearch = debounce(async (query: string) => {
  const results = await hereMapsService.geocodeAddress(query);
  showResults(results);
}, 500);

// ❌ Mala práctica: Llamar API en cada tecla
input.addEventListener('keyup', async (e) => {
  const results = await hereMapsService.geocodeAddress(e.target.value);
  // Demasiadas llamadas innecesarias
});
```

### 4. Validación de Coordenadas
```typescript
// ✅ Buena práctica: Validar antes de usar
if (hereMapsService.validateCoordinates(coords)) {
  addMarker(coords);
} else {
  console.error('Coordenadas inválidas:', coords);
}
```

---

## 📊 Límites y Consideraciones

### Límites de HERE Maps API
- **Geocodificación**: 250,000 transacciones/mes (plan gratuito)
- **Routing**: 250,000 transacciones/mes (plan gratuito)
- **Waypoints por ruta**: Máximo 150 waypoints
- **Multi-waypoint optimization**: Hasta 23 waypoints intermedios

### Consideraciones de Rendimiento
- Cache de geocodificaciones para direcciones frecuentes
- Limita actualizaciones de rastreo (5 segundos es razonable)
- Usa debounce en búsquedas en tiempo real
- Limpia objetos del mapa que ya no se usan

### Área de Validación
- Actualmente limitado a Zona Metropolitana de CDMX
- Latitud: 19.0° a 19.8°
- Longitud: -99.5° a -98.8°
- Configurable en `AddressService`

---

## 🎓 Recursos Adicionales

### Documentación HERE Maps
- [HERE Developer Portal](https://developer.here.com/)
- [Geocoding API Reference](https://developer.here.com/documentation/geocoding-search-api/dev_guide/index.html)
- [Routing API v8 Reference](https://developer.here.com/documentation/routing-api/8.16.0/dev_guide/index.html)
- [Maps API for JavaScript](https://developer.here.com/documentation/maps/3.1.47.0/dev_guide/index.html)

### Tutoriales Recomendados
- [Getting Started with HERE Maps](https://developer.here.com/documentation/examples/maps-js/index.html)
- [Route Optimization Best Practices](https://developer.here.com/blog/route-optimization)
- [Geocoding Best Practices](https://developer.here.com/blog/geocoding-best-practices)

---

## 🤝 Contribuir

Si tienes ejemplos adicionales o casos de uso interesantes, por favor contribuye al proyecto:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Agrega tus ejemplos a este documento
4. Envía un Pull Request

---

**Última actualización:** Noviembre 2025  
**Versión del proyecto:** 1.0.0  
**HERE Maps API Version:** v8 (Routing), v7 (Geocoding), v3 (Maps JS)
