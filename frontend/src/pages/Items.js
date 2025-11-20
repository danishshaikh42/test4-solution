import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';

function Items() {
  const { items, fetchItems, pageInfo } = useData();
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    setLoading(true);
    fetchItems({ signal, q, page, limit }).catch(err => {
      if (err.name === 'AbortError') return;
      console.error(err);
    }).finally(() => setLoading(false));

    return () => controller.abort();
  }, [fetchItems, page, q, limit]);

  const itemCount = items.length;

  // memoize row renderer so it doesn't recreate on every render
  const Row = useMemo(() => ({ index, style }) => {
    const item = items[index];
    if (!item) return null;
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
        <Link to={'/items/' + item.id}>{item.name}</Link>
      </div>
    );
  }, [items]);

  // height and itemSize are tuned for typical rows; adjust as needed
  const listHeight = 400;
  const itemSize = 48;

  return (
    <div style={{ padding: 16, fontFamily: 'Segoe UI, Roboto, Arial, sans-serif' }}>
      <div aria-live="polite" style={{ height: 24 }}>
        {loading ? 'Loading items…' : ''}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="search" style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>Search</label>
        <input
          id="search"
          aria-label="Search items"
          placeholder="Search items..."
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }}
          style={{ padding: 10, width: 320, maxWidth: '100%', borderRadius: 6, border: '1px solid #ccc' }}
        />
      </div>


      <div>
        {loading ? (
          // simple skeleton rows
          <div aria-hidden style={{ display: 'grid', gap: 8 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: itemSize - 12, background: '#eee', borderRadius: 6 }} />
            ))}
          </div>
        ) : itemCount === 0 ? (
          <p role="status">No items found.</p>
        ) : (
          <List
            height={listHeight}
            itemCount={itemCount}
            itemSize={itemSize}
            width="100%"
          >
            {Row}
          </List>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
        <span style={{ margin: '0 8px' }}>Page {page} of {pageInfo.totalPages}</span>
        <button onClick={() => setPage(p => Math.min(pageInfo.totalPages, p + 1))} disabled={page >= pageInfo.totalPages}>Next</button>
        <span style={{ marginLeft: 12 }}>Total: {pageInfo.total}</span>
      </div>
    </div>
  );
}

export default Items;