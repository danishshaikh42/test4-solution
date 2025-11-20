import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ItemDetail from '../pages/ItemDetail';

describe('ItemDetail page', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders item fetched by id', async () => {
    const mockItem = { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 2499 };
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockItem });

    render(
      <MemoryRouter initialEntries={["/items/1"]}>
        <Routes>
          <Route path="/items/:id" element={<ItemDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent('Laptop Pro');
    expect(screen.getByText(/Electronics/)).toBeInTheDocument();
    expect(screen.getByText(/\$2499/)).toBeInTheDocument();
  });
});
