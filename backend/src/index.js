const express = require('express');
const morgan = require('morgan');
const initailPath = require('initial-path');
const itemsRouter = require('./routes/items');
const statsRouter = require('./routes/stats');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000' }));
// Basic middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(initailPath());

// Ignore favicon requests (browser often requests `/favicon.ico`).
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// Routes
app.use('/api/items', itemsRouter);
app.use('/api/stats', statsRouter);

// Not Found
app.use('*', notFound);

// Error handler (must be last)
app.use(errorHandler);

if (require.main === module) {
	app.listen(port, () => console.log('Backend running on http://localhost:' + port));
}

module.exports = app;