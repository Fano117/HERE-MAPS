const coverageService = require('./coverageService');

function isPointInPolygon(point, polygon) {
  const { lat, lng } = point;
  const coordinates = polygon.coordinates;
  
  if (!coordinates || coordinates.length < 3) {
    return false;
  }

  let inside = false;
  let j = coordinates.length - 1;

  for (let i = 0; i < coordinates.length; i++) {
    const xi = coordinates[i].lat;
    const yi = coordinates[i].lng;
    const xj = coordinates[j].lat;
    const yj = coordinates[j].lng;

    if (((yi > lng) !== (yj > lng)) && 
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
    j = i;
  }

  return inside;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getDistanceToPolygon(point, polygon) {
  const { lat, lng } = point;
  const coordinates = polygon.coordinates;
  
  if (isPointInPolygon(point, polygon)) {
    return 0;
  }

  let minDistance = Infinity;
  
  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length;
    const distance = getDistanceToLineSegment(
      { lat, lng },
      coordinates[i],
      coordinates[j]
    );
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

function getDistanceToLineSegment(point, lineStart, lineEnd) {
  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return calculateDistance(point.lat, point.lng, lineStart.lat, lineStart.lng);
  }

  let param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = lineStart.lat;
    yy = lineStart.lng;
  } else if (param > 1) {
    xx = lineEnd.lat;
    yy = lineEnd.lng;
  } else {
    xx = lineStart.lat + param * C;
    yy = lineStart.lng + param * D;
  }

  return calculateDistance(point.lat, point.lng, xx, yy);
}

async function findPolygonForPoint(point) {
  try {
    const { loadCoverageData } = require('./coverageService');
    let polygons;
    
    try {
      polygons = await loadCoverageData();
    } catch (loadError) {
      polygons = [];
    }

    if (!polygons || polygons === null || polygons === undefined) {
      polygons = [];
    }

    if (!Array.isArray(polygons)) {
      polygons = [];
    }

    const containingPolygons = [];
    const distanceResults = [];

    for (const polygon of polygons) {
      if (!polygon || typeof polygon !== 'object') {
        continue;
      }
      
      if (!polygon.coordinates || !Array.isArray(polygon.coordinates)) {
        continue;
      }
      
      if (polygon.coordinates.length < 3) {
        continue;
      }

      const hasValidCoordinates = polygon.coordinates.every(coord => 
        coord && 
        typeof coord === 'object' && 
        typeof coord.lat === 'number' && 
        typeof coord.lng === 'number' &&
        !isNaN(coord.lat) && 
        !isNaN(coord.lng)
      );

      if (!hasValidCoordinates) {
        continue;
      }

      try {
        const isInside = isPointInPolygon(point, polygon);
        
        if (isInside) {
          containingPolygons.push({
            polygon,
            distance: 0,
            status: 'inside'
          });
        } else {
          const distance = getDistanceToPolygon(point, polygon);
          distanceResults.push({
            polygon,
            distance: Math.round(distance * 1000) / 1000,
            status: 'outside'
          });
        }
      } catch (polygonError) {
        continue;
      }
    }

    if (containingPolygons.length > 0) {
      return {
        status: 'inside',
        result: containingPolygons[0].polygon,
        distance: 0,
        allContaining: containingPolygons.map(r => r.polygon)
      };
    }

    if (distanceResults.length > 0) {
      distanceResults.sort((a, b) => a.distance - b.distance);
      return {
        status: 'outside',
        result: distanceResults[0].polygon,
        distance: distanceResults[0].distance,
        allDistances: distanceResults
      };
    }

    return {
      status: 'no_polygons',
      result: null,
      distance: null
    };

  } catch (error) {
    console.error('Error en findPolygonForPoint:', error);
    throw new Error(`Error analizando punto contra polígonos: ${error.message}`);
  }
}

async function analyzeAddressPoint(req, res) {
  try {
    console.log('analyzeAddressPoint - Body recibido:', req.body);
    
    const { lat, lng, address } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ 
        error: 'Se requieren coordenadas (lat, lng)' 
      });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);

    if (isNaN(numLat) || isNaN(numLng)) {
      return res.status(400).json({ 
        error: 'Las coordenadas deben ser números válidos' 
      });
    }

    if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return res.status(400).json({ 
        error: 'Coordenadas fuera de rango válido' 
      });
    }

    const point = { lat: numLat, lng: numLng };
    console.log('Analizando punto:', point);
    
    const analysis = await findPolygonForPoint(point);
    console.log('Resultado del análisis:', analysis);

    const response = {
      coordinates: point,
      address: address || null,
      ...analysis
    };

    res.json(response);

  } catch (error) {
    console.error('Error en analyzeAddressPoint:', error);
    res.status(500).json({ 
      error: 'Error al analizar punto',
      details: error.message 
    });
  }
}

async function analyzeMapPoint(req, res) {
  try {
    console.log('analyzeMapPoint - Body recibido:', req.body);
    
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ 
        error: 'Se requieren coordenadas (lat, lng)' 
      });
    }

    const numLat = Number(lat);
    const numLng = Number(lng);

    if (isNaN(numLat) || isNaN(numLng)) {
      return res.status(400).json({ 
        error: 'Las coordenadas deben ser números válidos' 
      });
    }

    if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      return res.status(400).json({ 
        error: 'Coordenadas fuera de rango válido' 
      });
    }

    const point = { lat: numLat, lng: numLng };
    console.log('Analizando punto del mapa:', point);
    
    const analysis = await findPolygonForPoint(point);
    console.log('Resultado del análisis del mapa:', analysis);

    const response = {
      coordinates: point,
      ...analysis
    };

    res.json(response);

  } catch (error) {
    console.error('Error en analyzeMapPoint:', error);
    res.status(500).json({ 
      error: 'Error al analizar punto del mapa',
      details: error.message 
    });
  }
}

module.exports = {
  isPointInPolygon,
  calculateDistance,
  getDistanceToPolygon,
  findPolygonForPoint,
  analyzeAddressPoint,
  analyzeMapPoint
};
