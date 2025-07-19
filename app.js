require('dotenv').config();
const express = require('express');
const app = express();
const syncService = require('./services/syncService');
const syncRoutes = require('./routes/syncRoutes');

// Routes
const manifestRoutes = require('./routes/manifestRoutes');
const financeRoutes = require('./routes/financeRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

app.use(express.json());

// Register routes
app.use('/api', manifestRoutes);
app.use('/api', financeRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/api', syncRoutes);


// Start synchronization
syncService.start();
console.log('Scheduled sync enabled (runs every 15 minutes)');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));