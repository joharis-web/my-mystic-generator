import { useEffect, useState } from 'react';

export default function Home() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-generate on load
  useEffect(() => {
    const storeKey = 'mystic_results_v1';
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storeKey) : null;
    if (saved) {
      try { setRows(JSON.parse(saved)); } catch {}
    }
    async function run() {
      try {
        const r = await fetch('/api/generate');
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || 'Gagal generate');
        const record = {
          waktu: new Date().toLocaleString('id-ID', { hour12: false }),
          angka: j.number,
          horoscope: j.audit?.sourceHealth?.horoscope || false,
          dream: j.audit?.sourceHealth?.dream || false,
          google: j.audit?.sourceHealth?.google || false,
          tiktok: j.audit?.sourceHealth?.tiktok || false
        };
        setRows(prev => {
          const next = [record, ...prev].slice(0, 100); // keep last 100
          localStorage.setItem(storeKey, JSON.stringify(next));
          return next;
        });
      } catch (e) {
        setError(e?.message || 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    }
    run();
  }, []);

  const onClear = () => {
    const storeKey = 'mystic_results_v1';
    localStorage.removeItem(storeKey);
    setRows([]);
  };

  return (
    <main style={{minHeight:'100vh', background:'#0b0b0d', color:'#e5e7eb'}}>
      <div style={{maxWidth:900, margin:'0 auto', padding:'24px'}}>
        <h1 style={{fontSize:28, fontWeight:800}}>🔮 Mystic 4-Digit — Otomatis</h1>
        <p style={{opacity:.7, marginTop:8}}>Tanpa input. Sistem mengumpulkan sinyal (horoscope, mimpi, google, tiktok) lalu hashing → 4 digit.</p>

        <div style={{display:'flex', gap:12, marginTop:16}}>
          <button onClick={()=>location.reload()} style={{background:'#4f46e5', color:'#fff', padding:'8px 12px', borderRadius:12, border:'none'}}>
            Generate lagi
          </button>
          <button onClick={onClear} style={{background:'#ef4444', color:'#fff', padding:'8px 12px', borderRadius:12, border:'none'}}>
            Hapus
          </button>
        </div>

        <div style={{marginTop:20, background:'#111114', borderRadius:16, padding:16}}>
          {loading ? <div>Sedang menghasilkan angka...</div> : null}
          {error ? <div style={{color:'#fca5a5'}}>Error: {error}</div> : null}
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={th}>Waktu</th>
                <th style={th}>Angka</th>
                <th style={th}>Horoscope</th>
                <th style={th}>Dream</th>
                <th style={th}>Google</th>
                <th style={th}>TikTok</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td style={td}>{r.waktu}</td>
                  <td style={{...td, fontWeight:900, letterSpacing:2}}>{r.angka}</td>
                  <td style={td}>{r.horoscope ? '✅' : '—'}</td>
                  <td style={td}>{r.dream ? '✅' : '—'}</td>
                  <td style={td}>{r.google ? '✅' : '—'}</td>
                  <td style={td}>{r.tiktok ? '✅' : '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading && !error && (
                <tr><td colSpan={6} style={{...td, textAlign:'center', opacity:.7}}>Belum ada data</td></tr>
              )}
            </tbody>
          </table>
          <p style={{opacity:.6, marginTop:8, fontSize:12}}>* Angka bersifat hiburan/tafsiran, tidak menjamin hasil apapun.</p>
        </div>
      </div>
    </main>
  );
}

const th = { textAlign:'left', padding:'10px 8px', borderBottom:'1px solid #1f2937', fontSize:13, opacity:.8 };
const td = { padding:'10px 8px', borderBottom:'1px solid #111827', fontSize:14 };
