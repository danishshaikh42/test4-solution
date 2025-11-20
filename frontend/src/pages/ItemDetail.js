import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch('/api/items/' + id)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => { if (mounted) setItem(data); })
      .catch(() => navigate('/'))
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [id, navigate]);

  return (
    <main style={{ padding: 16, fontFamily: 'Segoe UI, Roboto, Arial, sans-serif' }}>
      <button onClick={() => navigate(-1)} aria-label="Go back" style={{ marginBottom: 12 }}>← Back</button>

      {loading ? (
        <div aria-live="polite">Loading item…</div>
      ) : !item ? (
        <div role="status">Item not found.</div>
      ) : (
        <article>
          <h2>{item.name}</h2>
          <p><strong>Category:</strong> {item.category}</p>
          <p><strong>Price:</strong> ${item.price}</p>
        </article>
      )}
    </main>
  );
}

export default ItemDetail;