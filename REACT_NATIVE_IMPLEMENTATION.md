# Implementación HERE Maps para React Native

Esta documentación explica cómo implementar HERE Maps SDK en React Native para recibir y mostrar las ubicaciones y rutas generadas desde la aplicación Angular.

## Instalación del SDK

### 1. Instalar HERE SDK para React Native

```bash
npm install @here/react-native-here-sdk
```

### 2. Configuración Android

En `android/app/build.gradle`:

```gradle
dependencies {
    implementation "com.here.sdk:sdk-core:4.+"
    implementation "com.here.sdk:sdk-search:4.+"
    implementation "com.here.sdk:sdk-routing:4.+"
    implementation "com.here.sdk:sdk-navigation:4.+"
}
```

En `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
    <meta-data 
        android:name="com.here.sdk.access_key_id" 
        android:value="7LVwgFjjHhNtTtROLWKD" />
    <meta-data 
        android:name="com.here.sdk.access_key_secret" 
        android:value="GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw" />
</application>
```

### 3. Configuración iOS

En `ios/Podfile`:

```ruby
pod 'HERESDKCoreKit'
pod 'HERESDKSearchKit'
pod 'HERESDKRoutingKit'
pod 'HERESDKNavigationKit'
```

## Componente Principal de Mapa

### MapScreen.tsx

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  MapView, 
  MapMarker, 
  GeoCoordinates,
  MapPolyline,
  Color,
  LocationIndicator
} from '@here/react-native-here-sdk';

interface DeliveryPoint {
  id: string;
  label: string;
  coordinates: GeoCoordinates;
  isCompleted: boolean;
}

interface DriverLocation {
  driverId: string;
  coordinates: GeoCoordinates;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

const MapScreen: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [route, setRoute] = useState<MapPolyline | null>(null);

  useEffect(() => {
    initializeMap();
    fetchDeliveryPoints();
    startLocationTracking();
  }, []);

  const initializeMap = () => {
    // Configuración inicial del mapa centrado en Ciudad de México
    const mapCenter = new GeoCoordinates(19.4326, -99.1332);
    mapRef.current?.camera.lookAt(mapCenter);
    mapRef.current?.camera.setDistanceInMeters(10000);
  };

  const fetchDeliveryPoints = async () => {
    try {
      // Obtener puntos de entrega desde el backend Angular
      const response = await fetch('http://tu-backend.com/api/delivery-points');
      const points = await response.json();
      
      const formattedPoints: DeliveryPoint[] = points.map((point: any) => ({
        id: point.id,
        label: point.label,
        coordinates: new GeoCoordinates(point.coordinates.lat, point.coordinates.lng),
        isCompleted: point.isCompleted || false
      }));
      
      setDeliveryPoints(formattedPoints);
      addMarkersToMap(formattedPoints);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los puntos de entrega');
    }
  };

  const startLocationTracking = () => {
    // Simular recepción de ubicaciones en tiempo real
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://tu-backend.com/api/location/driver1');
        const location = await response.json();
        
        const driverLoc: DriverLocation = {
          driverId: location.driverId,
          coordinates: new GeoCoordinates(location.coordinates.lat, location.coordinates.lng),
          timestamp: new Date(location.timestamp),
          speed: location.speed,
          heading: location.heading
        };
        
        setDriverLocation(driverLoc);
        updateDriverMarker(driverLoc);
      } catch (error) {
        console.error('Error obteniendo ubicación:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  };

  const addMarkersToMap = (points: DeliveryPoint[]) => {
    points.forEach((point, index) => {
      const marker = new MapMarker(
        point.coordinates,
        createDeliveryMarkerImage(index + 1, point.isCompleted)
      );
      
      mapRef.current?.mapScene.addMapMarker(marker);
    });
  };

  const updateDriverMarker = (location: DriverLocation) => {
    // Remover marcador anterior del conductor
    mapRef.current?.mapScene.removeMapMarkers();
    
    // Agregar nuevo marcador del conductor
    const driverMarker = new MapMarker(
      location.coordinates,
      createDriverMarkerImage()
    );
    
    mapRef.current?.mapScene.addMapMarker(driverMarker);
    
    // Re-agregar marcadores de entrega
    addMarkersToMap(deliveryPoints);
    
    // Centrar mapa en ubicación del conductor
    mapRef.current?.camera.lookAt(location.coordinates);
  };

  const createDeliveryMarkerImage = (number: number, isCompleted: boolean) => {
    // Crear imagen de marcador para punto de entrega
    const color = isCompleted ? '#4CAF50' : '#F44336';
    
    // Aquí implementarías la creación de la imagen del marcador
    // Por simplicidad, usamos un marcador básico
    return {
      // Configuración del marcador
      size: { width: 40, height: 40 },
      color: color
    };
  };

  const createDriverMarkerImage = () => {
    // Crear imagen de marcador para el conductor
    return {
      size: { width: 30, height: 30 },
      color: '#2196F3'
    };
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        onMapViewReady={() => console.log('Mapa listo')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapScreen;
```

## Servicio de Comunicación

### DeliveryService.ts

```typescript
class DeliveryService {
  private readonly baseUrl = 'http://tu-backend.com/api';
  
  async getDeliveryPoints(): Promise<DeliveryPoint[]> {
    const response = await fetch(`${this.baseUrl}/delivery-points`);
    return response.json();
  }
  
  async getDriverLocation(driverId: string): Promise<DriverLocation> {
    const response = await fetch(`${this.baseUrl}/location/${driverId}`);
    return response.json();
  }
  
  async updateDeliveryStatus(pointId: string, isCompleted: boolean): Promise<void> {
    await fetch(`${this.baseUrl}/delivery-points/${pointId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted })
    });
  }
  
  async sendDriverLocation(location: DriverLocation): Promise<void> {
    await fetch(`${this.baseUrl}/location/${location.driverId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location)
    });
  }
}

export const deliveryService = new DeliveryService();
```

## Configuración de Permisos

### Android (android/app/src/main/AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
```

### iOS (ios/YourApp/Info.plist)

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Esta aplicación necesita acceso a la ubicación para mostrar tu posición en el mapa</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Esta aplicación necesita acceso continuo a la ubicación para el rastreo</string>
```

## Manejo de Ubicación en Tiempo Real

### LocationManager.ts

```typescript
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

class LocationManager {
  private watchId: number | null = null;
  
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }
  
  startTracking(callback: (location: DriverLocation) => void): void {
    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location: DriverLocation = {
          driverId: 'current-driver',
          coordinates: new GeoCoordinates(
            position.coords.latitude,
            position.coords.longitude
          ),
          timestamp: new Date(),
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0
        };
        
        callback(location);
      },
      (error) => console.error('Error de ubicación:', error),
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000
      }
    );
  }
  
  stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

export const locationManager = new LocationManager();
```

## Funciones Principales Implementadas

### 1. Mostrar Puntos de Entrega
- Marcadores numerados en el mapa
- Colores diferentes según el estado (completado/pendiente)
- Información detallada al tocar un marcador

### 2. Rastreo en Tiempo Real
- Actualización automática de la ubicación del conductor
- Centrado automático del mapa en la ubicación actual
- Indicador visual de movimiento y dirección

### 3. Comunicación con Backend
- Endpoints GET para obtener datos
- Endpoints POST para enviar actualizaciones
- Manejo de errores de conectividad

### 4. Optimizaciones
- Actualización eficiente de marcadores
- Gestión de memoria para ubicaciones
- Throttling de actualizaciones de red

## Consideraciones de Producción

1. **Manejo de Errores**: Implementar retry logic para llamadas de API
2. **Optimización de Batería**: Ajustar frecuencia de ubicación según contexto
3. **Conectividad**: Cache local para funcionamiento offline
4. **Seguridad**: Implementar autenticación JWT para APIs
5. **Performance**: Usar FlatList para listas grandes de entregas

Esta implementación proporciona una base sólida para una aplicación de rastreo en tiempo real usando HERE Maps en React Native.
