import React, { useEffect, useMemo, useState } from 'react';
import { defaultItems } from './BudgetTracker';

const KENYAN_GREEN = '#006633';

function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

function classNames(...c) { return c.filter(Boolean).join(' '); }

export default function SmartPantry() {
  const [items] = useState(() => loadLocal('pantry_items', defaultItems));
  const [onhand, setOnhand] = useState(() => loadLocal('pantry_onhand', {}));

  useEffect(() => saveLocal('pantry_onhand', onhand), [onhand]);

  const list = useMemo(() => items.map((i) => ({
    ...i,
    onhand: Number(onhand[i.id] || 0),
    need: Number(Math.max((i.weeklyNeed || 0) - Number(onhand[i.id] || 0), 0).toFixed(2)),
  })), [items, onhand]);

  const flagged = list.filter((i) => (i.weeklyNeed || 0) > 0 && (i.onhand / i.weeklyNeed) <= 0.25);
  const urgent = flagged.filter((i) => i.staple);

  const [shoppingText, setShoppingText] = useState('');

  useEffect(() => {
    const lines = list
      .filter((i) => i.need > 0)
      .map((i) => `- ${i.name}: ${i.need} ${i.unit}`);
    setShoppingText(lines.join('\n'));
  }, [list]);

  return (
    <section className="w-full p-4">
      <div className="rounded-xl p-4" style={{ background: '#f1f8f4', border: `1px solid ${KENYAN_GREEN}22` }}>
        <h2 className="text-lg font-semibold" style={{ color: KENYAN_GREEN }}>Smart Pantry</h2>
        <p className="text-xs text-gray-600">Set what you have on hand. We estimate what's needed this week and flag low items.</p>

        {urgent.length > 0 && (
          <div className="mt-3 p-3 rounded-md text-sm" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <div className="font-medium text-amber-800">Urgent restock</div>
            <div className="text-amber-700 text-xs">Staples at ≥75% depleted: {urgent.map((i) => i.name).join(', ')}</div>
          </div>
        )}

        <ul className="mt-3 divide-y rounded-lg border">
          {list.map((i) => (
            <li key={i.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{i.name}</div>
                  <div className="text-xs text-gray-500">Need {i.weeklyNeed} {i.unit}/week</div>
                </div>
                <div className="text-right">
                  <label className="text-xs text-gray-500">On hand</label>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.1" value={i.onhand} onChange={(e) => setOnhand({ ...onhand, [i.id]: Number(e.target.value) })} className="w-24 px-2 py-1 rounded border text-right" />
                    <span className="text-xs text-gray-500">{i.unit}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={classNames('h-2 rounded-full', (i.onhand / (i.weeklyNeed || 1)) <= 0.25 ? 'bg-amber-500' : 'bg-emerald-600')} style={{ width: `${Math.min((i.onhand / (i.weeklyNeed || 1)) * 100, 100)}%` }} />
              </div>
              <div className="text-xs text-gray-600 mt-1">Need to buy: {i.need} {i.unit} · Est. cost KES {(i.need * i.pricePerUnit).toFixed(0)}</div>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <h3 className="text-sm font-medium" style={{ color: KENYAN_GREEN }}>Generate Shopping List</h3>
          <textarea className="w-full mt-2 px-3 py-2 rounded-md border h-28" value={shoppingText} readOnly />
          <div className="mt-2 flex gap-2">
            <button onClick={() => { navigator.clipboard?.writeText(shoppingText); alert('Copied list to clipboard'); }} className="px-3 py-2 rounded-md text-white" style={{ background: KENYAN_GREEN }}>Copy</button>
            <button onClick={() => {
              const blob = new Blob([shoppingText], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'shopping-list.txt'; a.click();
              URL.revokeObjectURL(url);
            }} className="px-3 py-2 rounded-md border" style={{ borderColor: KENYAN_GREEN, color: KENYAN_GREEN }}>Save .txt</button>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Tip: Long-press to select and paste into WhatsApp or SMS.</div>
        </div>
      </div>
    </section>
  );
}
