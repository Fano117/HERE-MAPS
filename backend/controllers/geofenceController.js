const geolib = require('geolib');

// Almacenamiento de geocercas de entregas
const geofences = new Map();
const DEFAULT_GEOFENCE_RADIUS = 200; // 200 metros

// Verificar proximidad a entrega
const checkGeofence = (req, res) => {
  try {
    const { choferId, lat, lng } = req.body;
    
    if (!choferId || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }
    
    const choferPosition = { latitude: lat, longitude: lng };
    let closestDelivery = null;
    let minDistance = Infinity;
    
    // Buscar todas las geocercas activas
    for (const [embarqueId, deliveries] of geofences.entries()) {
      for (const delivery of deliveries) {
        if (delivery.estado === 'completada') continue;
        
        const deliveryPosition = {
          latitude: delivery.lat,
          longitude: delivery.lng
        };
        
        const distance = geolib.getDistance(choferPosition, deliveryPosition);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestDelivery = {
            ...delivery,
            distancia: distance
          };
        }
      }
    }
    
    if (closestDelivery && minDistance <= closestDelivery.radio) {
      // Dentro de geocerca
      return res.json({
        dentroGeocerca: true,
        distancia: minDistance,
        ordenId: closestDelivery.ordenId,
        accionRequerida: minDistance <= 100 ? 'habilitar_entrega' : 'notificar_cliente'
      });
    }
    
    // Fuera de geocerca
    res.json({
      dentroGeocerca: false,
      distancia: minDistance === Infinity ? null : minDistance,
      ordenId: closestDelivery ? closestDelivery.ordenId : null,
      accionRequerida: null
    });
  } catch (error) {
    console.error('Error checking geofence:', error);
    res.status(500).json({ error: 'Error al verificar geocerca' });
  }
};

// Configurar geocercas de entregas
const setupGeofences = (req, res) => {
  try {
    const { embarqueId, entregas } = req.body;
    
    if (!embarqueId || !entregas || !Array.isArray(entregas)) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }
    
    const geofenceEntregas = entregas.map(entrega => ({
      ordenId: entrega.ordenId,
      lat: entrega.lat,
      lng: entrega.lng,
      radio: entrega.radio || DEFAULT_GEOFENCE_RADIUS,
      estado: 'pendiente'
    }));
    
    geofences.set(embarqueId.toString(), geofenceEntregas);
    
    res.json({
      success: true,
      embarqueId,
      geocercasCreadas: geofenceEntregas.length
    });
  } catch (error) {
    console.error('Error setting up geofences:', error);
    res.status(500).json({ error: 'Error al configurar geocercas' });
  }
};

// Marcar entrega como completada
const completeDelivery = (embarqueId, ordenId) => {
  const deliveries = geofences.get(embarqueId.toString());
  if (deliveries) {
    const delivery = deliveries.find(d => d.ordenId === ordenId);
    if (delivery) {
      delivery.estado = 'completada';
      return true;
    }
  }
  return false;
};

module.exports = {
  checkGeofence,
  setupGeofences,
  completeDelivery
};
