const fs = require('fs').promises;
const path = require('path');

const COVERAGE_DATA_FILE = path.join(__dirname, '../data/coverage-polygons.json');

async function ensureDataDirectoryExists() {
  const dataDir = path.dirname(COVERAGE_DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function loadCoverageData() {
  try {
    await ensureDataDirectoryExists();
    const data = await fs.readFile(COVERAGE_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveCoverageData(data) {
  await ensureDataDirectoryExists();
  await fs.writeFile(COVERAGE_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function getAllCoveragePolygons(req, res) {
  try {
    const polygons = await loadCoverageData();
    res.json(polygons);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar los polígonos de cobertura' });
  }
}

async function createCoveragePolygon(req, res) {
  try {
    const newPolygon = req.body;
    
    if (!newPolygon.id || !newPolygon.name || !newPolygon.coordinates || !Array.isArray(newPolygon.coordinates)) {
      return res.status(400).json({ error: 'Datos del polígono inválidos' });
    }

    const polygons = await loadCoverageData();
    
    const existingIndex = polygons.findIndex(p => p.id === newPolygon.id);
    if (existingIndex !== -1) {
      return res.status(409).json({ error: 'Ya existe un polígono con ese ID' });
    }

    newPolygon.created = newPolygon.created || new Date().toISOString();
    newPolygon.updated = new Date().toISOString();
    
    polygons.push(newPolygon);
    await saveCoverageData(polygons);
    
    res.status(201).json({ success: true, polygon: newPolygon });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el polígono de cobertura' });
  }
}

async function updateCoveragePolygon(req, res) {
  try {
    const polygonId = req.params.id;
    const updatedPolygon = req.body;
    
    if (!updatedPolygon.name || !updatedPolygon.coordinates || !Array.isArray(updatedPolygon.coordinates)) {
      return res.status(400).json({ error: 'Datos del polígono inválidos' });
    }

    const polygons = await loadCoverageData();
    const existingIndex = polygons.findIndex(p => p.id === polygonId);
    
    if (existingIndex === -1) {
      return res.status(404).json({ error: 'Polígono no encontrado' });
    }

    const existingPolygon = polygons[existingIndex];
    polygons[existingIndex] = {
      ...existingPolygon,
      name: updatedPolygon.name,
      coordinates: updatedPolygon.coordinates,
      updated: new Date().toISOString()
    };
    
    await saveCoverageData(polygons);
    
    res.json({ success: true, polygon: polygons[existingIndex] });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el polígono de cobertura' });
  }
}

async function deleteCoveragePolygon(req, res) {
  try {
    const polygonId = req.params.id;
    
    const polygons = await loadCoverageData();
    const existingIndex = polygons.findIndex(p => p.id === polygonId);
    
    if (existingIndex === -1) {
      return res.status(404).json({ error: 'Polígono no encontrado' });
    }

    polygons.splice(existingIndex, 1);
    await saveCoverageData(polygons);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el polígono de cobertura' });
  }
}

module.exports = {
  getAllCoveragePolygons,
  createCoveragePolygon,
  updateCoveragePolygon,
  deleteCoveragePolygon
};
