const geolib = require('geolib');

// Almacenamiento de ubicaciones de choferes en tiempo real
const choferLocations = new Map();
const choferMetadata = new Map();

// Actualizar ubicación de chofer
const updateChoferLocation = (req, res) => {
  try {
    const { choferId, lat, lng, timestamp, velocidad, heading } = req.body;
    
    if (!choferId || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }
    
    const location = {
      choferId: parseInt(choferId),
      lat,
      lng,
      timestamp: timestamp || new Date().toISOString(),
      velocidad: velocidad || 0,
      heading: heading || 0
    };
    
    choferLocations.set(choferId.toString(), location);
    
    // Emitir evento WebSocket si está disponible
    if (global.io) {
      global.io.emit('chofer_movimiento', location);
    }
    
    res.json({ success: true, location });
  } catch (error) {
    console.error('Error updating chofer location:', error);
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
};

// Obtener ubicaciones en tiempo real para dashboard
const getLiveTracking = (req, res) => {
  try {
    const { almacenId } = req.params;
    
    // Filtrar choferes por almacén
    const choferes = [];
    
    for (const [choferId, location] of choferLocations.entries()) {
      const metadata = choferMetadata.get(choferId) || {};
      
      if (!almacenId || metadata.almacenId === parseInt(almacenId)) {
        choferes.push({
          choferId: parseInt(choferId),
          nombre: metadata.nombre || `Chofer ${choferId}`,
          ubicacionActual: {
            lat: location.lat,
            lng: location.lng
          },
          ultimaActualizacion: location.timestamp,
          velocidad: location.velocidad,
          proximaEntrega: metadata.proximaEntrega || null
        });
      }
    }
    
    res.json({ choferes });
  } catch (error) {
    console.error('Error getting live tracking:', error);
    res.status(500).json({ error: 'Error al obtener seguimiento en vivo' });
  }
};

// Configurar metadata de chofer
const setChoferMetadata = (choferId, metadata) => {
  choferMetadata.set(choferId.toString(), metadata);
};

// Calcular ETA a próxima entrega
const calculateETA = async (origen, destino) => {
  try {
    const distancia = geolib.getDistance(
      { latitude: origen.lat, longitude: origen.lng },
      { latitude: destino.lat, longitude: destino.lng }
    );
    
    // Estimar tiempo basado en velocidad promedio de 40 km/h en ciudad
    const tiempoMinutos = Math.round((distancia / 1000) / 40 * 60);
    
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + tiempoMinutos);
    
    return {
      distancia,
      tiempoMinutos,
      eta: eta.toISOString()
    };
  } catch (error) {
    console.error('Error calculating ETA:', error);
    return null;
  }
};

module.exports = {
  updateChoferLocation,
  getLiveTracking,
  setChoferMetadata,
  calculateETA
};
