require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const path = require('path');


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

const syncService = require('./services/syncService');

// Routes
const manifestRoutes = require('./routes/manifestRoutes');
const financeRoutes = require('./routes/financeRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const syncRoutes = require('./routes/syncRoutes');
const uploadCsvRoute = require('./routes/uploadCsvRoute');
const uploadXlsxRoute = require('./routes/uploadXlsxRoute');

app.use('/api', uploadXlsxRoute);


app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Register routes
app.use('/api', manifestRoutes);
app.use('/api', financeRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/api', syncRoutes);
app.use('/api', uploadCsvRoute);
// app.use(uploadCsvRoute);

app.use((req, res, next) => {
    console.log(`Incoming ${req.method} to ${req.path}`);
    console.log('Headers:', req.headers);
    next();
});

app.use((err, req, res, next) => {
    console.log(err);
    
  console.error(err.stack);
  res.status(500).send({ error: 'Something went wrong!' });
});



// Start synchronization
// syncService.start();
// console.log('Scheduled sync enabled (runs every 15 minutes)');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));