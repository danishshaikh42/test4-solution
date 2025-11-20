const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const initialPath = require('initial-path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data
async function readData() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  return JSON.parse(raw);
}

// GET /api/items
// Supports optional query params: q (search), page, limit
router.get('/', async (req, res, next) => {
  try {
    const data = await readData();
    const q = req.query.q ? String(req.query.q).toLowerCase() : '';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);

    let results = data;

    if (q) {
      // Simple substring search (case-insensitive)
      results = results.filter(item => (item.name || '').toLowerCase().includes(q));
    }

    const total = results.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const pageItems = results.slice(start, start + limit);

    initialPath();
    res.json({ items: pageItems, page, limit, total, totalPages });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', async (req, res, next) => {
  try {
    // Minimal validation
    const item = req.body;
    if (!item || !item.name) {
      const err = new Error('Invalid item payload');
      err.status = 400;
      throw err;
    }

    const data = await readData();
    item.id = Date.now();
    data.push(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    // Try to refresh stats cache proactively; failure here shouldn't block the request
    try {
      // require the stats router and call its refreshCache helper if available
      // note: use a relative import to avoid circular dependency issues at module load time
      const statsRouter = require('./stats');
      if (statsRouter && typeof statsRouter.refreshCache === 'function') {
        statsRouter.refreshCache().catch(err => console.error('Failed to refresh stats cache:', err.message || err));
      }
    } catch (err) {
      console.error('Could not refresh stats cache (ignored):', err.message || err);
    }

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;