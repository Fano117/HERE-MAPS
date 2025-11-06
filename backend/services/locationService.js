const driverLocations = new Map();
const simulationIntervals = new Map();

const mexicoCityBounds = {
  north: 19.5929,
  south: 19.0926,
  east: -98.9234,
  west: -99.3671
};

const dummyRoutes = {
  driver1: [
    { lat: 19.4326, lng: -99.1332 },
    { lat: 19.4284, lng: -99.1276 },
    { lat: 19.4240, lng: -99.1220 },
    { lat: 19.4196, lng: -99.1164 },
    { lat: 19.4152, lng: -99.1108 },
    { lat: 19.4108, lng: -99.1052 }
  ],
  driver2: [
    { lat: 19.4500, lng: -99.1500 },
    { lat: 19.4456, lng: -99.1456 },
    { lat: 19.4412, lng: -99.1412 },
    { lat: 19.4368, lng: -99.1368 },
    { lat: 19.4324, lng: -99.1324 },
    { lat: 19.4280, lng: -99.1280 }
  ],
  driver3: [
    { lat: 19.4200, lng: -99.1700 },
    { lat: 19.4244, lng: -99.1656 },
    { lat: 19.4288, lng: -99.1612 },
    { lat: 19.4332, lng: -99.1568 },
    { lat: 19.4376, lng: -99.1524 },
    { lat: 19.4420, lng: -99.1480 }
  ]
};

const routeProgress = new Map();

const getDriverLocation = (req, res) => {
  const { driverId } = req.params;
  
  let location = driverLocations.get(driverId);
  
  if (!location) {
    location = generateInitialLocation(driverId);
    driverLocations.set(driverId, location);
  }

  res.json(location);
};

const updateDriverLocation = (req, res) => {
  const { driverId } = req.params;
  const { coordinates, speed, heading } = req.body;

  const location = {
    driverId,
    coordinates,
    timestamp: new Date(),
    speed: speed || Math.floor(Math.random() * 60) + 20,
    heading: heading || Math.floor(Math.random() * 360)
  };

  driverLocations.set(driverId, location);
  res.json({ success: true, location });
};

const startSimulation = (req, res) => {
  const { driverId } = req.params;
  
  if (simulationIntervals.has(driverId)) {
    return res.json({ success: false, message: 'Simulación ya está activa' });
  }

  routeProgress.set(driverId, 0);
  
  const interval = setInterval(() => {
    updateSimulatedLocation(driverId);
  }, 5000);
  
  simulationIntervals.set(driverId, interval);
  
  res.json({ success: true, message: 'Simulación iniciada' });
};

const stopSimulation = (req, res) => {
  const { driverId } = req.params;
  
  const interval = simulationIntervals.get(driverId);
  if (interval) {
    clearInterval(interval);
    simulationIntervals.delete(driverId);
    routeProgress.delete(driverId);
  }
  
  res.json({ success: true, message: 'Simulación detenida' });
};

const generateInitialLocation = (driverId) => {
  const route = dummyRoutes[driverId];
  const initialCoords = route ? route[0] : generateRandomCoordinates();
  
  return {
    driverId,
    coordinates: initialCoords,
    timestamp: new Date(),
    speed: Math.floor(Math.random() * 60) + 20,
    heading: Math.floor(Math.random() * 360)
  };
};

const updateSimulatedLocation = (driverId) => {
  const route = dummyRoutes[driverId];
  if (!route) return;
  
  let progress = routeProgress.get(driverId) || 0;
  
  if (progress >= route.length - 1) {
    progress = 0;
  }
  
  const currentPoint = route[progress];
  const nextPoint = route[progress + 1] || route[0];
  
  const interpolatedCoords = interpolateCoordinates(currentPoint, nextPoint, Math.random());
  
  const location = {
    driverId,
    coordinates: interpolatedCoords,
    timestamp: new Date(),
    speed: Math.floor(Math.random() * 40) + 30,
    heading: calculateHeading(currentPoint, nextPoint)
  };
  
  driverLocations.set(driverId, location);
  routeProgress.set(driverId, progress + 1);
};

const generateRandomCoordinates = () => {
  const lat = Math.random() * (mexicoCityBounds.north - mexicoCityBounds.south) + mexicoCityBounds.south;
  const lng = Math.random() * (mexicoCityBounds.east - mexicoCityBounds.west) + mexicoCityBounds.west;
  
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
};

const interpolateCoordinates = (start, end, factor) => {
  return {
    lat: start.lat + (end.lat - start.lat) * factor,
    lng: start.lng + (end.lng - start.lng) * factor
  };
};

const calculateHeading = (start, end) => {
  const dLng = end.lng - start.lng;
  const dLat = end.lat - start.lat;
  const heading = Math.atan2(dLng, dLat) * (180 / Math.PI);
  return (heading + 360) % 360;
};

module.exports = {
  getDriverLocation,
  updateDriverLocation,
  startSimulation,
  stopSimulation
};
