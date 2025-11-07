const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:4201'],
    credentials: true
  }
});

// Hacer io global para que los controladores puedan usarlo
global.io = io;

const port = process.env.PORT || 3000;

app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4201'],
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:4200');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const locationService = require('./services/locationService');
const routeService = require('./services/routeService');
const coverageService = require('./services/coverageService');
const polygonAnalysisService = require('./services/polygonAnalysisService');

// Nuevos controladores
const choferRoutesController = require('./controllers/choferRoutesController');
const geofenceController = require('./controllers/geofenceController');
const trackingController = require('./controllers/trackingController');
const notificationsController = require('./controllers/notificationsController');
const simulationController = require('./controllers/simulationController');

// Rutas existentes
app.get('/api/location/:driverId', locationService.getDriverLocation);
app.post('/api/location/:driverId', locationService.updateDriverLocation);

app.get('/api/routes/:driverId', routeService.getDriverRoute);
app.post('/api/routes/:driverId', routeService.updateDriverRoute);
app.get('/api/addresses/problematic', routeService.getProblematicAddresses);

app.get('/api/simulation/start/:driverId', locationService.startSimulation);
app.get('/api/simulation/stop/:driverId', locationService.stopSimulation);

app.get('/api/coverage', coverageService.getAllCoveragePolygons);
app.post('/api/coverage', coverageService.createCoveragePolygon);
app.post('/api/coverage/:id', coverageService.updateCoveragePolygon);
app.post('/api/coverage/delete/:id', coverageService.deleteCoveragePolygon);

app.post('/api/polygon-analysis/address', polygonAnalysisService.analyzeAddressPoint);
app.post('/api/polygon-analysis/point', polygonAnalysisService.analyzeMapPoint);

// Nuevas rutas para sistema de entregas

// Módulo de Rutas de Choferes
app.get('/api/routes/chofer/:choferId', choferRoutesController.getChoferRoute);
app.post('/api/routes/chofer/:choferId', choferRoutesController.updateChoferRoute);

// Módulo de Geocercas
app.post('/api/geofence/check', geofenceController.checkGeofence);
app.post('/api/geofence/setup', geofenceController.setupGeofences);

// Módulo de Seguimiento en Tiempo Real
app.post('/api/tracking/update', trackingController.updateChoferLocation);
app.get('/api/tracking/live/:almacenId', trackingController.getLiveTracking);

// Módulo de Notificaciones
app.post('/api/notifications/proximity', notificationsController.sendProximityNotification);
app.post('/api/notifications/alert', notificationsController.sendAlertNotification);
app.get('/api/notifications/history', notificationsController.getNotificationHistory);

// Módulo de Simulación
app.get('/api/simulation/routes', simulationController.getSimulationRoutes);
app.post('/api/simulation/start', simulationController.startSimulation);
app.post('/api/simulation/stop/:choferId', simulationController.stopSimulation);

// WebSocket para actualizaciones en tiempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('subscribe_tracking', (data) => {
    const { almacenId } = data;
    socket.join(`almacen_${almacenId}`);
    console.log(`Cliente ${socket.id} suscrito a almacen ${almacenId}`);
  });
  
  socket.on('unsubscribe_tracking', (data) => {
    const { almacenId } = data;
    socket.leave(`almacen_${almacenId}`);
    console.log(`Cliente ${socket.id} desuscrito de almacen ${almacenId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Servidor ejecutándose en puerto ${port}`);
  console.log(`WebSocket disponible en ws://localhost:${port}`);
});
