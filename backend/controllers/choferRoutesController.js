const axios = require('axios');
const HERE_API_KEY = 'GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw';

// Almacenamiento en memoria de rutas de choferes
const choferRoutes = new Map();

// Obtener ruta de chofer asignado
const getChoferRoute = async (req, res) => {
  try {
    const { choferId } = req.params;
    
    let route = choferRoutes.get(choferId);
    
    if (!route) {
      // Crear ruta por defecto si no existe
      route = {
        choferId: parseInt(choferId),
        almacenId: 1,
        rutaActual: {
          puntos: [],
          distanciaTotal: 0,
          tiempoEstimado: 0
        },
        entregas: []
      };
      choferRoutes.set(choferId, route);
    }
    
    res.json(route);
  } catch (error) {
    console.error('Error getting chofer route:', error);
    res.status(500).json({ error: 'Error al obtener ruta del chofer' });
  }
};

// Actualizar ruta de chofer
const updateChoferRoute = async (req, res) => {
  try {
    const { choferId } = req.params;
    const { puntos, recalcular } = req.body;
    
    if (!puntos || !Array.isArray(puntos)) {
      return res.status(400).json({ error: 'Puntos inválidos' });
    }
    
    let rutaActual = {
      puntos: [],
      distanciaTotal: 0,
      tiempoEstimado: 0
    };
    
    if (recalcular && puntos.length > 1) {
      // Calcular ruta con HERE Maps Routing API
      try {
        const routeData = await calculateRouteWithWaypoints(puntos);
        rutaActual = {
          puntos: puntos.map((punto, index) => ({
            lat: punto.lat,
            lng: punto.lng,
            orden: index + 1,
            direccion: punto.direccion || '',
            cliente: punto.cliente || ''
          })),
          distanciaTotal: routeData.distanciaTotal,
          tiempoEstimado: routeData.tiempoEstimado
        };
      } catch (error) {
        console.error('Error calculating route:', error);
        // Usar puntos sin cálculo de ruta si falla
        rutaActual = {
          puntos: puntos.map((punto, index) => ({
            lat: punto.lat,
            lng: punto.lng,
            orden: index + 1,
            direccion: punto.direccion || '',
            cliente: punto.cliente || ''
          })),
          distanciaTotal: 0,
          tiempoEstimado: 0
        };
      }
    } else {
      rutaActual = {
        puntos: puntos.map((punto, index) => ({
          lat: punto.lat,
          lng: punto.lng,
          orden: index + 1,
          direccion: punto.direccion || '',
          cliente: punto.cliente || ''
        })),
        distanciaTotal: 0,
        tiempoEstimado: 0
      };
    }
    
    const route = choferRoutes.get(choferId) || {};
    route.rutaActual = rutaActual;
    route.choferId = parseInt(choferId);
    choferRoutes.set(choferId, route);
    
    res.json({ success: true, route });
  } catch (error) {
    console.error('Error updating chofer route:', error);
    res.status(500).json({ error: 'Error al actualizar ruta del chofer' });
  }
};

// Función auxiliar para calcular ruta con waypoints usando HERE API
async function calculateRouteWithWaypoints(puntos) {
  try {
    if (puntos.length < 2) {
      return { distanciaTotal: 0, tiempoEstimado: 0 };
    }
    
    const origin = `${puntos[0].lat},${puntos[0].lng}`;
    const destination = `${puntos[puntos.length - 1].lat},${puntos[puntos.length - 1].lng}`;
    
    const urlParams = new URLSearchParams({
      transportMode: 'car',
      origin: origin,
      destination: destination,
      return: 'summary',
      apikey: HERE_API_KEY
    });
    
    // Agregar waypoints intermedios
    for (let i = 1; i < puntos.length - 1; i++) {
      urlParams.append('via', `${puntos[i].lat},${puntos[i].lng}`);
    }
    
    const url = `https://router.hereapi.com/v8/routes?${urlParams.toString()}`;
    const response = await axios.get(url);
    
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const summary = route.sections.reduce((acc, section) => {
        acc.length += section.summary.length;
        acc.duration += section.summary.duration;
        return acc;
      }, { length: 0, duration: 0 });
      
      return {
        distanciaTotal: Math.round(summary.length), // metros
        tiempoEstimado: Math.round(summary.duration / 60) // minutos
      };
    }
    
    return { distanciaTotal: 0, tiempoEstimado: 0 };
  } catch (error) {
    console.error('Error calculating route with HERE API:', error);
    throw error;
  }
}

module.exports = {
  getChoferRoute,
  updateChoferRoute
};
