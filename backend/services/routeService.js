const driverRoutes = new Map();

const defaultDeliveryPoints = {
  driver1: [
    {
      id: 'delivery-1',
      address: 'PROL CUITLAHUAC, San Martín Centro, San Martín de las Pirámides, Estado de México, 55850, México',
      coordinates: { lat: 19.4326, lng: -99.1332 },
      status: 'pending',
      estimatedTime: 15
    },
    {
      id: 'delivery-2',
      address: 'Av. Paseo de la Reforma 222, Juárez, Ciudad de México, 06600, México',
      coordinates: { lat: 19.4284, lng: -99.1276 },
      status: 'pending',
      estimatedTime: 20
    },
    {
      id: 'delivery-3',
      address: 'Eje Central Lázaro Cárdenas 13, Centro Histórico, Ciudad de México, 06000, México',
      coordinates: { lat: 19.4240, lng: -99.1220 },
      status: 'pending',
      estimatedTime: 12
    }
  ],
  driver2: [
    {
      id: 'delivery-4',
      address: 'Av. Universidad 3000, Ciudad Universitaria, Ciudad de México, 04510, México',
      coordinates: { lat: 19.4500, lng: -99.1500 },
      status: 'pending',
      estimatedTime: 18
    },
    {
      id: 'delivery-5',
      address: 'Av. Insurgentes Sur 1457, Del Valle Sur, Ciudad de México, 03100, México',
      coordinates: { lat: 19.4456, lng: -99.1456 },
      status: 'pending',
      estimatedTime: 25
    }
  ],
  driver3: [
    {
      id: 'delivery-6',
      address: 'Polanco V Sección, Ciudad de México, 11560, México',
      coordinates: { lat: 19.4200, lng: -99.1700 },
      status: 'pending',
      estimatedTime: 30
    },
    {
      id: 'delivery-7',
      address: 'Santa Fe, Álvaro Obregón, Ciudad de México, 01210, México',
      coordinates: { lat: 19.4244, lng: -99.1656 },
      status: 'pending',
      estimatedTime: 22
    }
  ]
};

const getDriverRoute = (req, res) => {
  const { driverId } = req.params;
  
  let route = driverRoutes.get(driverId);
  
  if (!route) {
    const deliveryPoints = defaultDeliveryPoints[driverId] || [];
    route = {
      driverId,
      deliveryPoints: deliveryPoints,
      completedPoints: [],
      currentIndex: 0,
      estimatedDuration: calculateEstimatedDuration(deliveryPoints),
      totalDistance: calculateTotalDistance(deliveryPoints),
      startingPoint: {
        id: 'starting-point',
        address: 'Av. Universidad 3000, Ciudad Universitaria, Ciudad de México, 04510, México',
        coordinates: { lat: 19.3263, lng: -99.1757 }
      }
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

const getProblematicAddresses = (req, res) => {
  const problematicAddresses = [
    {
      id: 'prob-1',
      originalAddress: 'CALLE YAUTEPEC 501',
      status: 'incorrect',
      suggestions: [
        {
          id: 'sug-1',
          address: 'Calle Yautepec 501, Doctores, Ciudad de México, 06720, México',
          coordinates: { lat: 19.4178, lng: -99.1447 },
          confidence: 0.85
        },
        {
          id: 'sug-2',
          address: 'Calle Yautepec, Letrán Valle, Ciudad de México, 03650, México',
          coordinates: { lat: 19.3916, lng: -99.1523 },
          confidence: 0.65
        }
      ]
    },
    {
      id: 'prob-2',
      originalAddress: 'AV INSURGENTES 123 COLONIA ROMA',
      status: 'incomplete',
      suggestions: [
        {
          id: 'sug-3',
          address: 'Av. Insurgentes Sur 123, Roma Norte, Ciudad de México, 06700, México',
          coordinates: { lat: 19.4126, lng: -99.1626 },
          confidence: 0.90
        },
        {
          id: 'sug-4',
          address: 'Av. Insurgentes Norte 123, Santa María la Ribera, Ciudad de México, 06400, México',
          coordinates: { lat: 19.4501, lng: -99.1543 },
          confidence: 0.75
        }
      ]
    },
    {
      id: 'prob-3',
      originalAddress: 'CALLE FALSA 999',
      status: 'not_found',
      suggestions: []
    }
  ];

  res.json({
    total: problematicAddresses.length,
    addresses: problematicAddresses
  });
};

module.exports = {
  getDriverRoute,
  updateDriverRoute,
  getProblematicAddresses
};
