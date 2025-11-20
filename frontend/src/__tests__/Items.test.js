import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Items from '../pages/Items';
import { DataProvider } from '../state/DataContext';

describe('Items page', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('renders items after loading skeleton', async () => {
    const mockResponse = { items: [ { id: 1, name: 'Laptop Pro' } ], page: 1, limit: 5, total: 1, totalPages: 1 };
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

    render(
      <MemoryRouter>
        <DataProvider>
          <Items />
        </DataProvider>
      </MemoryRouter>
    );

    // wait for item to appear
    expect(await screen.findByText('Laptop Pro')).toBeInTheDocument();
  });

  test('search triggers fetch with q param', async () => {
    // initial load
    const initial = { items: [], page: 1, limit: 5, total: 0, totalPages: 1 };
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => initial });

    render(
      <MemoryRouter>
        <DataProvider>
          <Items />
        </DataProvider>
      </MemoryRouter>
    );

    // wait initial fetch
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // prepare next fetch response
    const searched = { items: [ { id: 2, name: 'Chair' } ], page: 1, limit: 5, total: 1, totalPages: 1 };
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => searched });

    const input = screen.getByLabelText(/Search items/i);
    fireEvent.change(input, { target: { value: 'chair' } });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    // ensure fetch was called with q param somewhere in the URL
    const calledUrls = global.fetch.mock.calls.map(c => c[0]);
    expect(calledUrls.some(u => String(u).includes('q=chair'))).toBe(true);

    // the new item appears
    expect(await screen.findByText('Chair')).toBeInTheDocument();
  });
});
