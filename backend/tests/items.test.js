const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const app = require('../src/index');

const DATA_PATH = path.join(__dirname, '../../data/items.json');

let originalData;

beforeAll(async () => {
  // backup original data file
  originalData = await fs.readFile(DATA_PATH, 'utf8');
});

afterAll(async () => {
  // restore original data file
  await fs.writeFile(DATA_PATH, originalData, 'utf8');
});

describe('Items API', () => {
  test('GET /api/items returns all items', async () => {
    const res = await request(app)
      .get('/api/items')
      .expect('Content-Type', /json/)
      .expect(200);
    // server may return a paginated shape { items, page, limit, total, totalPages }
    const body = res.body;
    const items = Array.isArray(body) ? body : (body && Array.isArray(body.items) ? body.items : []);
    expect(Array.isArray(items)).toBe(true);
    const orig = JSON.parse(originalData);
    expect(items.length).toBe(orig.length);
  });

  test('GET /api/items/:id returns an item', async () => {
    const orig = JSON.parse(originalData);
    const id = orig[0].id;

    const res = await request(app)
      .get('/api/items/' + id)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('id', id);
    expect(res.body).toHaveProperty('name', orig[0].name);
  });

  test('GET /api/items/:id returns 404 for missing id', async () => {
    await request(app)
      .get('/api/items/99999999')
      .expect(404);
  });

  test('POST /api/items creates a new item', async () => {
    const payload = { name: 'Test Item', category: 'Test', price: 1 };

    const res = await request(app)
      .post('/api/items')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('name', payload.name);

    // ensure file was updated
    const after = JSON.parse(await fs.readFile(DATA_PATH, 'utf8'));
    expect(after.some(i => i.name === payload.name)).toBe(true);
  });
});
