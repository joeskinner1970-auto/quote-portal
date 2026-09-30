'use client';

import { FormEvent, useMemo, useState } from 'react';

type Quote = { customer: string; email: string; vehicle: string; registration: string; price: string; notes: string };

export default function StaffQuotePortal() {
  const [quote, setQuote] = useState<Quote>({ customer: '', email: '', vehicle: '', registration: '', price: '', notes: '' });
  const [saved, setSaved] = useState(false);
  const reference = useMemo(() => 'AQ-' + new Date().toISOString().slice(0, 10).replaceAll('-', '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(), []);
  const update = (key: keyof Quote, value: string) => setQuote(current => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); setSaved(true); };
  return (
    <main style={{ maxWidth: 920, margin: '0 auto', padding: '48px 20px', fontFamily: 'Arial, sans-serif', color: '#172033' }}>
      <header style={{ marginBottom: 32 }}><p style={{ color: '#64748b', margin: 0 }}>STAFF AREA</p><h1 style={{ margin: '8px 0' }}>Auto Quote Portal</h1><p style={{ color: '#475569' }}>Create a clear vehicle quotation for your customer.</p></header>
      <form onSubmit={submit} style={{ display: 'grid', gap: 16, background: '#f8fafc', padding: 24, borderRadius: 12 }}>
        <h2 style={{ margin: 0 }}>New quotation</h2>
        <label>Customer name<input required value={quote.customer} onChange={e => update('customer', e.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: 10 }} /></label>
        <label>Customer email<input type="email" value={quote.email} onChange={e => update('email', e.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: 10 }} /></label>
        <label>Vehicle<input required value={quote.vehicle} onChange={e => update('vehicle', e.target.value)} placeholder="Make, model and specification" style={{ display: 'block', width: '100%', marginTop: 6, padding: 10 }} /></label>
        <label>Registration<input value={quote.registration} onChange={e => update('registration', e.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: 10 }} /></label>
        <label>Quoted price (£)<input required inputMode="decimal" value={quote.price} onChange={e => update('price', e.target.value)} style={{ display: 'block', width: '100%', marginTop: 6, padding: 10 }} /></label>
        <label>Notes<textarea value={quote.notes} onChange={e => update('notes', e.target.value)} rows={4} style={{ display: 'block', width: '100%', marginTop: 6, padding: 10 }} /></label>
        <button type="submit" style={{ padding: '12px 18px', border: 0, borderRadius: 8, background: '#0f4c81', color: 'white', fontWeight: 700 }}>Create quotation</button>
      </form>
      {saved && <section style={{ marginTop: 28, padding: 24, border: '1px solid #cbd5e1', borderRadius: 12 }}><p style={{ color: '#166534', fontWeight: 700 }}>Quotation ready</p><h2>{quote.customer || 'Customer'} — {quote.vehicle}</h2><p>Reference: {reference}</p><p>Registration: {quote.registration || 'Not provided'}</p><p>Quoted price: £{quote.price}</p><p>{quote.notes}</p><button onClick={() => window.print()} style={{ padding: '10px 16px', borderRadius: 8 }}>Print or save as PDF</button></section>}
    </main>
  );
}
