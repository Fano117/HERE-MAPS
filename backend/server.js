const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
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

app.listen(port, () => {
  console.log(`Servidor ejecutándose en puerto ${port}`);
});
