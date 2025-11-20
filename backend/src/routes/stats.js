const express = require('express');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Simple in-memory cache for computed stats
let cachedStats = null;

async function computeStats() {
  const raw = await fsp.readFile(DATA_PATH, 'utf8');
  const items = JSON.parse(raw);
  const total = items.length;
  const averagePrice = total ? items.reduce((acc, cur) => acc + (cur.price || 0), 0) / total : 0;
  return { total, averagePrice };
}

// Prime the cache once at startup (best-effort)
computeStats()
  .then(stats => { cachedStats = stats; })
  .catch(() => { cachedStats = null; });

// Watch the data file and refresh cache when it changes
if (process.env.NODE_ENV !== 'test') {
  fs.watchFile(DATA_PATH, { interval: 1000 }, async (curr, prev) => {
    if (curr.mtimeMs !== prev.mtimeMs) {
      try {
        cachedStats = await computeStats();
      } catch (err) {
        // On error, clear cache so next request will attempt recompute and return the error
        cachedStats = null;
        console.error('Failed to refresh stats cache:', err.message || err);
      }
    }
  });
}

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    if (cachedStats) return res.json(cachedStats);
    const stats = await computeStats();
    cachedStats = stats;
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// Allow other modules to explicitly refresh the cached stats after writes
router.refreshCache = async function refreshCache() {
  try {
    cachedStats = await computeStats();
    return cachedStats;
  } catch (err) {
    cachedStats = null;
    throw err;
  }
};

module.exports = router;