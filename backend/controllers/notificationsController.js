// Controlador de notificaciones
// En un ambiente de producción, aquí se integraría con servicios como Twilio, SendGrid, etc.

const notificationQueue = [];

// Enviar notificación de proximidad a cliente
const sendProximityNotification = (req, res) => {
  try {
    const { ordenId, choferId, eta, canal } = req.body;
    
    if (!ordenId || !choferId) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }
    
    const notification = {
      tipo: 'proximidad',
      ordenId,
      choferId,
      eta: eta || new Date().toISOString(),
      canal: canal || 'sms',
      timestamp: new Date().toISOString(),
      estado: 'pendiente'
    };
    
    // En producción, aquí se enviaría la notificación real
    console.log('Notificación de proximidad:', notification);
    
    notificationQueue.push(notification);
    
    // Emitir evento WebSocket
    if (global.io) {
      global.io.emit('notificacion_enviada', notification);
    }
    
    res.json({
      success: true,
      notificationId: notificationQueue.length,
      mensaje: `Notificación ${canal} enviada para orden ${ordenId}`
    });
  } catch (error) {
    console.error('Error sending proximity notification:', error);
    res.status(500).json({ error: 'Error al enviar notificación' });
  }
};

// Enviar notificación a encargado de embarque
const sendAlertNotification = (req, res) => {
  try {
    const { embarqueId, tipo, choferId, mensaje } = req.body;
    
    if (!embarqueId || !tipo || !choferId) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }
    
    const notification = {
      tipo: 'alerta',
      subtipo: tipo, // 'fuera_geocerca', 'retraso', 'incidencia'
      embarqueId,
      choferId,
      mensaje: mensaje || 'Alerta del sistema',
      timestamp: new Date().toISOString(),
      estado: 'pendiente'
    };
    
    console.log('Notificación de alerta:', notification);
    
    notificationQueue.push(notification);
    
    // Emitir evento WebSocket
    if (global.io) {
      global.io.emit('alerta_embarque', notification);
    }
    
    res.json({
      success: true,
      notificationId: notificationQueue.length,
      mensaje: `Alerta enviada para embarque ${embarqueId}`
    });
  } catch (error) {
    console.error('Error sending alert notification:', error);
    res.status(500).json({ error: 'Error al enviar alerta' });
  }
};

// Obtener historial de notificaciones
const getNotificationHistory = (req, res) => {
  try {
    res.json({
      total: notificationQueue.length,
      notificaciones: notificationQueue.slice(-50) // Últimas 50
    });
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

module.exports = {
  sendProximityNotification,
  sendAlertNotification,
  getNotificationHistory
};
