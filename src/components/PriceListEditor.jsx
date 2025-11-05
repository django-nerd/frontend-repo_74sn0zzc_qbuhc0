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

const units = ['kg', 'L', 'pcs', 'bunch'];

export default function PriceListEditor() {
  const [items, setItems] = useState(() => loadLocal('pantry_items', defaultItems));

  useEffect(() => saveLocal('pantry_items', items), [items]);

  const [newItem, setNewItem] = useState({ name: '', unit: 'kg', pricePerUnit: 0, weeklyNeed: 1, staple: false, substitute: '' });

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };
  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const onhand = loadLocal('pantry_onhand', {});
    delete onhand[id];
    saveLocal('pantry_onhand', onhand);
  };
  const addItem = () => {
    if (!newItem.name.trim()) return;
    const id = newItem.name.toLowerCase().replace(/\s+/g, '_');
    if (items.find((i) => i.id === id)) {
      alert('Item with similar name exists');
      return;
    }
    const entry = { id, ...newItem, pricePerUnit: Number(newItem.pricePerUnit), weeklyNeed: Number(newItem.weeklyNeed) };
    setItems((prev) => [...prev, entry]);
    setNewItem({ name: '', unit: 'kg', pricePerUnit: 0, weeklyNeed: 1, staple: false, substitute: '' });
  };

  return (
    <section className="w-full p-4">
      <div className="rounded-xl p-4 space-y-3" style={{ background: '#f1f8f4', border: `1px solid ${KENYAN_GREEN}22` }}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: KENYAN_GREEN }}>Price List</h2>
          <p className="text-xs text-gray-600">Edit prices, add items (e.g., sukuma wiki, wheat flour), or remove what you don't use.</p>
        </div>

        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-5">
            <label className="text-xs">Name</label>
            <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="w-full px-3 py-2 rounded-md border" placeholder="e.g., Sukuma wiki" />
          </div>
          <div className="col-span-2">
            <label className="text-xs">Unit</label>
            <select value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} className="w-full px-3 py-2 rounded-md border">
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs">KES / unit</label>
            <input type="number" value={newItem.pricePerUnit} onChange={(e) => setNewItem({ ...newItem, pricePerUnit: e.target.value })} className="w-full px-3 py-2 rounded-md border" />
          </div>
          <div className="col-span-2">
            <label className="text-xs">Weekly need</label>
            <input type="number" step="0.1" value={newItem.weeklyNeed} onChange={(e) => setNewItem({ ...newItem, weeklyNeed: e.target.value })} className="w-full px-3 py-2 rounded-md border" />
          </div>
          <div className="col-span-1 flex items-center gap-2">
            <input id="staple" type="checkbox" checked={newItem.staple} onChange={(e) => setNewItem({ ...newItem, staple: e.target.checked })} />
            <label htmlFor="staple" className="text-xs">Staple</label>
          </div>
          <div className="col-span-12">
            <label className="text-xs">Substitute (optional, id of cheaper item e.g., beans)</label>
            <input value={newItem.substitute} onChange={(e) => setNewItem({ ...newItem, substitute: e.target.value })} className="w-full px-3 py-2 rounded-md border" placeholder="beans" />
          </div>
          <div className="col-span-12">
            <button onClick={addItem} className="px-3 py-2 rounded-md text-white" style={{ background: KENYAN_GREEN }}>Add Item</button>
          </div>
        </div>

        <div className="mt-2">
          <ul className="divide-y rounded-lg border">
            {items.map((i) => (
              <li key={i.id} className="p-3 grid grid-cols-12 gap-2 items-center">
                <input className="col-span-3 px-2 py-1 rounded border" value={i.name} onChange={(e) => updateItem(i.id, { name: e.target.value })} />
                <select className="col-span-2 px-2 py-1 rounded border" value={i.unit} onChange={(e) => updateItem(i.id, { unit: e.target.value })}>
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <input className="col-span-2 px-2 py-1 rounded border" type="number" value={i.pricePerUnit} onChange={(e) => updateItem(i.id, { pricePerUnit: Number(e.target.value) })} />
                <input className="col-span-2 px-2 py-1 rounded border" type="number" step="0.1" value={i.weeklyNeed} onChange={(e) => updateItem(i.id, { weeklyNeed: Number(e.target.value) })} />
                <label className="col-span-2 text-xs flex items-center gap-2">
                  <input type="checkbox" checked={i.staple} onChange={(e) => updateItem(i.id, { staple: e.target.checked })} /> staple
                </label>
                <input className="col-span-1 hidden" />
                <div className="col-span-12 flex items-center justify-between mt-2">
                  <div className="text-[11px] text-gray-500">ID: {i.id} · Sub: {i.substitute || '—'}</div>
                  <div className="flex gap-2">
                    <button onClick={() => updateItem(i.id, { substitute: prompt('Enter substitute id (e.g., beans) or clear', i.substitute || '') || '' })} className="text-xs px-2 py-1 rounded border" style={{ borderColor: KENYAN_GREEN, color: KENYAN_GREEN }}>Set substitute</button>
                    <button onClick={() => removeItem(i.id)} className="text-xs px-2 py-1 rounded border text-red-600 border-red-200">Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
