const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const locationService = require('./services/locationService');
const routeService = require('./services/routeService');

app.get('/api/location/:driverId', locationService.getDriverLocation);
app.post('/api/location/:driverId', locationService.updateDriverLocation);

app.get('/api/routes/:driverId', routeService.getDriverRoute);
app.post('/api/routes/:driverId', routeService.updateDriverRoute);

app.get('/api/simulation/start/:driverId', locationService.startSimulation);
app.get('/api/simulation/stop/:driverId', locationService.stopSimulation);

app.listen(port, () => {
  console.log(`Servidor ejecutándose en puerto ${port}`);
});
