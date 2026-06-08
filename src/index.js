const express = require('express');
const mongoose = require('mongoose');
const pool = require('./config/db');
require('dotenv').config();

const app = express();
app.use(express.json());
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

//Conexion MongoDB 
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error MongoDB:', err.message));

//Rutas PostgreSQL
app.use('/api', require('./routes/citasRoutes'));
app.use('/api', require('./routes/pagosRoutes'));
app.use('/api', require('./routes/reportesRoutes'));

//Rutas MongoDB
app.use('/api', require('./routes/mongoRoutes'));

//Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', motores: 'PostgreSQL + MongoDB', timestamp: new Date() });
});

//Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});
