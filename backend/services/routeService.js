const driverRoutes = new Map();

const getDriverRoute = (req, res) => {
  const { driverId } = req.params;
  
  let route = driverRoutes.get(driverId);
  
  if (!route) {
    route = {
      driverId,
      deliveryPoints: [],
      completedPoints: [],
      currentIndex: 0,
      estimatedDuration: 0,
      totalDistance: 0
    };
    driverRoutes.set(driverId, route);
  }
  
  res.json(route);
};

const updateDriverRoute = (req, res) => {
  const { driverId } = req.params;
  const { deliveryPoints, completedPoints, currentIndex } = req.body;
  
  const route = {
    driverId,
    deliveryPoints: deliveryPoints || [],
    completedPoints: completedPoints || [],
    currentIndex: currentIndex || 0,
    estimatedDuration: calculateEstimatedDuration(deliveryPoints),
    totalDistance: calculateTotalDistance(deliveryPoints),
    lastUpdated: new Date()
  };
  
  driverRoutes.set(driverId, route);
  
  res.json({ success: true, route });
};

const calculateEstimatedDuration = (deliveryPoints) => {
  if (!deliveryPoints || deliveryPoints.length === 0) return 0;
  
  const averageTimePerPoint = 15;
  const travelTimeFactor = 1.5;
  
  return Math.ceil(deliveryPoints.length * averageTimePerPoint * travelTimeFactor);
};

const calculateTotalDistance = (deliveryPoints) => {
  if (!deliveryPoints || deliveryPoints.length < 2) return 0;
  
  let totalDistance = 0;
  
  for (let i = 0; i < deliveryPoints.length - 1; i++) {
    const distance = calculateDistance(
      deliveryPoints[i].coordinates,
      deliveryPoints[i + 1].coordinates
    );
    totalDistance += distance;
  }
  
  return Math.round(totalDistance);
};

const calculateDistance = (coord1, coord2) => {
  const R = 6371e3;
  const φ1 = coord1.lat * Math.PI / 180;
  const φ2 = coord2.lat * Math.PI / 180;
  const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
  const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

module.exports = {
  getDriverRoute,
  updateDriverRoute
};
