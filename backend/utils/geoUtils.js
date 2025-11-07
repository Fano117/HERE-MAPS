/**
 * Utilidades geoespaciales compartidas
 */

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {Object} coord1 - Primera coordenada {lat, lng}
 * @param {Object} coord2 - Segunda coordenada {lat, lng}
 * @returns {number} Distancia en metros
 */
function calculateDistance(coord1, coord2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = coord1.lat * Math.PI / 180;
  const φ2 = coord2.lat * Math.PI / 180;
  const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
  const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

/**
 * Calcula el heading (dirección) entre dos puntos
 * @param {Object} start - Punto inicial {lat, lng}
 * @param {Object} end - Punto final {lat, lng}
 * @returns {number} Heading en grados (0-360)
 */
function calculateHeading(start, end) {
  const dLng = end.lng - start.lng;
  const dLat = end.lat - start.lat;
  const heading = Math.atan2(dLng, dLat) * (180 / Math.PI);
  return (heading + 360) % 360;
}

/**
 * Valida coordenadas geográficas
 * @param {Object} coord - Coordenada {lat, lng}
 * @returns {boolean} True si las coordenadas son válidas
 */
function validateCoordinates(coord) {
  return coord.lat >= -90 && coord.lat <= 90 && 
         coord.lng >= -180 && coord.lng <= 180 &&
         !isNaN(coord.lat) && !isNaN(coord.lng);
}

/**
 * Calcula el ETA (tiempo estimado de llegada)
 * @param {number} distanceMeters - Distancia en metros
 * @param {number} speedKmh - Velocidad en km/h
 * @returns {Object} {tiempoMinutos, eta}
 */
function calculateETA(distanceMeters, speedKmh = 40) {
  const tiempoMinutos = Math.round((distanceMeters / 1000) / speedKmh * 60);
  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + tiempoMinutos);
  
  return {
    tiempoMinutos,
    eta: eta.toISOString()
  };
}

/**
 * Interpola coordenadas entre dos puntos
 * @param {Object} start - Punto inicial {lat, lng}
 * @param {Object} end - Punto final {lat, lng}
 * @param {number} factor - Factor de interpolación (0-1)
 * @returns {Object} Coordenada interpolada {lat, lng}
 */
function interpolateCoordinates(start, end, factor) {
  return {
    lat: start.lat + (end.lat - start.lat) * factor,
    lng: start.lng + (end.lng - start.lng) * factor
  };
}

module.exports = {
  calculateDistance,
  calculateHeading,
  validateCoordinates,
  calculateETA,
  interpolateCoordinates
};
