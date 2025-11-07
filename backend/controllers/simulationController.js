// Controlador de simulación para testing

const { calculateDistance, calculateHeading } = require('../utils/geoUtils');

const simulationIntervals = new Map();
const simulationRoutes = new Map();

// Rutas predefinidas para 3 choferes en Ciudad de México
const PREDEFINED_ROUTES = {
  1: {
    choferId: 1,
    nombre: 'Ruta Centro - Norte',
    puntos: [
      { lat: 19.4326, lng: -99.1332, direccion: 'Zócalo, Centro Histórico', cliente: 'Cliente A' },
      { lat: 19.4284, lng: -99.1276, direccion: 'Alameda Central', cliente: 'Cliente B' },
      { lat: 19.4240, lng: -99.1220, direccion: 'Paseo de la Reforma 222', cliente: 'Cliente C' },
      { lat: 19.4360, lng: -99.1412, direccion: 'Monumento a la Revolución', cliente: 'Cliente D' },
      { lat: 19.4445, lng: -99.1543, direccion: 'Santa María la Ribera', cliente: 'Cliente E' }
    ]
  },
  2: {
    choferId: 2,
    nombre: 'Ruta Sur - Poniente',
    puntos: [
      { lat: 19.3263, lng: -99.1757, direccion: 'Ciudad Universitaria', cliente: 'Cliente F' },
      { lat: 19.3500, lng: -99.1700, direccion: 'Perisur', cliente: 'Cliente G' },
      { lat: 19.3700, lng: -99.1800, direccion: 'Insurgentes Sur', cliente: 'Cliente H' },
      { lat: 19.3900, lng: -99.1900, direccion: 'San Ángel', cliente: 'Cliente I' },
      { lat: 19.4000, lng: -99.2000, direccion: 'Santa Fe', cliente: 'Cliente J' }
    ]
  },
  3: {
    choferId: 3,
    nombre: 'Ruta Oriente',
    puntos: [
      { lat: 19.4900, lng: -99.0800, direccion: 'Indios Verdes', cliente: 'Cliente K' },
      { lat: 19.4700, lng: -99.0900, direccion: 'La Villa', cliente: 'Cliente L' },
      { lat: 19.4500, lng: -99.1000, direccion: 'Lindavista', cliente: 'Cliente M' },
      { lat: 19.4400, lng: -99.1100, direccion: 'Instituto Politécnico Nacional', cliente: 'Cliente N' },
      { lat: 19.4300, lng: -99.1200, direccion: 'Tlatelolco', cliente: 'Cliente O' }
    ]
  }
};

// Obtener rutas predefinidas
const getSimulationRoutes = (req, res) => {
  try {
    res.json({
      rutas: Object.values(PREDEFINED_ROUTES)
    });
  } catch (error) {
    console.error('Error getting simulation routes:', error);
    res.status(500).json({ error: 'Error al obtener rutas de simulación' });
  }
};

// Iniciar simulación de ruta
const startSimulation = (req, res) => {
  try {
    const { choferId, rutaId, velocidad } = req.body;
    
    if (!choferId) {
      return res.status(400).json({ error: 'choferId es requerido' });
    }
    
    const choferIdStr = choferId.toString();
    
    // Verificar si ya existe una simulación activa
    if (simulationIntervals.has(choferIdStr)) {
      return res.status(400).json({ 
        error: 'Ya existe una simulación activa para este chofer',
        mensaje: 'Detén la simulación actual antes de iniciar una nueva'
      });
    }
    
    // Obtener ruta (predefinida o personalizada)
    const route = rutaId ? PREDEFINED_ROUTES[rutaId] : PREDEFINED_ROUTES[choferId];
    
    if (!route) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    
    // Configuración de la simulación
    const velocidadKmh = velocidad || 60;
    const velocidadMps = velocidadKmh / 3.6; // metros por segundo
    const intervaloMs = 2000; // Actualizar cada 2 segundos
    const distanciaPorActualizacion = velocidadMps * (intervaloMs / 1000); // metros
    
    const simulation = {
      choferId: parseInt(choferId),
      route: route.puntos,
      currentIndex: 0,
      progress: 0,
      velocidad: velocidadKmh,
      started: new Date().toISOString()
    };
    
    simulationRoutes.set(choferIdStr, simulation);
    
    // Iniciar intervalo de simulación
    const interval = setInterval(() => {
      updateSimulationPosition(choferIdStr, distanciaPorActualizacion);
    }, intervaloMs);
    
    simulationIntervals.set(choferIdStr, interval);
    
    res.json({
      success: true,
      mensaje: 'Simulación iniciada',
      choferId: parseInt(choferId),
      ruta: route.nombre,
      velocidad: velocidadKmh,
      puntos: route.puntos.length
    });
  } catch (error) {
    console.error('Error starting simulation:', error);
    res.status(500).json({ error: 'Error al iniciar simulación' });
  }
};

// Detener simulación
const stopSimulation = (req, res) => {
  try {
    const { choferId } = req.params;
    const choferIdStr = choferId.toString();
    
    const interval = simulationIntervals.get(choferIdStr);
    
    if (interval) {
      clearInterval(interval);
      simulationIntervals.delete(choferIdStr);
      simulationRoutes.delete(choferIdStr);
      
      res.json({
        success: true,
        mensaje: 'Simulación detenida',
        choferId: parseInt(choferId)
      });
    } else {
      res.status(404).json({
        error: 'No hay simulación activa para este chofer'
      });
    }
  } catch (error) {
    console.error('Error stopping simulation:', error);
    res.status(500).json({ error: 'Error al detener simulación' });
  }
};

// Actualizar posición en la simulación
function updateSimulationPosition(choferId, distancia) {
  const simulation = simulationRoutes.get(choferId);
  
  if (!simulation || !simulation.route) {
    return;
  }
  
  const route = simulation.route;
  const currentIndex = simulation.currentIndex;
  
  if (currentIndex >= route.length - 1) {
    // Ruta completada, reiniciar o detener
    simulation.currentIndex = 0;
    simulation.progress = 0;
  } else {
    const currentPoint = route[currentIndex];
    const nextPoint = route[currentIndex + 1];
    
    // Calcular distancia entre puntos
    const segmentDistance = calculateDistance(currentPoint, nextPoint);
    
    // Actualizar progreso
    simulation.progress += distancia;
    
    if (simulation.progress >= segmentDistance) {
      // Mover al siguiente punto
      simulation.currentIndex++;
      simulation.progress = 0;
      
      // Emitir llegada a punto
      if (global.io) {
        global.io.emit('chofer_punto_alcanzado', {
          choferId: parseInt(choferId),
          puntoIndex: simulation.currentIndex,
          punto: route[simulation.currentIndex]
        });
      }
    } else {
      // Interpolar posición actual
      const factor = simulation.progress / segmentDistance;
      const interpolatedPosition = {
        lat: currentPoint.lat + (nextPoint.lat - currentPoint.lat) * factor,
        lng: currentPoint.lng + (nextPoint.lng - currentPoint.lng) * factor
      };
      
      // Calcular heading
      const heading = calculateHeading(currentPoint, nextPoint);
      
      // Emitir posición actualizada
      if (global.io) {
        global.io.emit('chofer_movimiento', {
          choferId: parseInt(choferId),
          lat: interpolatedPosition.lat,
          lng: interpolatedPosition.lng,
          timestamp: new Date().toISOString(),
          velocidad: simulation.velocidad,
          heading: heading
        });
      }
    }
  }
}

module.exports = {
  getSimulationRoutes,
  startSimulation,
  stopSimulation
};
