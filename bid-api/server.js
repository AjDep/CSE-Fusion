// server.js
const express = require('express');
const cors = require('cors');
const { PORT, CLEANUP_INTERVAL_HOURS } = require('./config');
const companiesRoutes = require('./routes/companies');
const tablesRoutes = require('./routes/tables');
const bidAskRoutes = require('./routes/bidAsk');
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api/companies', companiesRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/bid-ask', bidAskRoutes);


// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
