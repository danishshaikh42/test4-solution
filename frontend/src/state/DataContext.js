import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // fetchItems accepts an options object so callers can pass an AbortSignal
  const fetchItems = useCallback(async (options = {}) => {
    const { signal, q, limit } = options;
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (q) params.set('q', q);

    // Use relative path so CRA proxy works in development
    const url = '/api/items' + (params.toString() ? `?${params.toString()}` : '');
    const res = await fetch(url, { signal });
    const json = await res.json();
    // Server returns paginated shape { items, page, limit, total, totalPages }
    if (json && Array.isArray(json.items)) {
      setItems(json.items);
      setPageInfo({ page: json.page || 1, limit: json.limit || 20, total: json.total || 0, totalPages: json.totalPages || 1 });
    } else if (Array.isArray(json)) {
      // fallback for older responses
      setItems(json);
      setPageInfo({ page: 1, limit: json.length, total: json.length, totalPages: 1 });
    }
  }, []);

  return (
    <DataContext.Provider value={{ items, fetchItems, pageInfo }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);