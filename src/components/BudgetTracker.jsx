import React, { useEffect, useMemo, useState } from 'react';

const KENYAN_GREEN = '#006633';

export const defaultItems = [
  { id: 'milk', name: 'Milk', unit: 'L', pricePerUnit: 75, weeklyNeed: 3, staple: true, substitute: 'beans' },
  { id: 'maize_flour', name: 'Maize flour', unit: 'kg', pricePerUnit: 180, weeklyNeed: 2, staple: true, substitute: 'beans' },
  { id: 'eggs', name: 'Eggs', unit: 'pcs', pricePerUnit: 18, weeklyNeed: 10, staple: true, substitute: 'beans' },
  { id: 'beef', name: 'Beef', unit: 'kg', pricePerUnit: 650, weeklyNeed: 1, staple: false, substitute: 'beans' },
  { id: 'beans', name: 'Beans', unit: 'kg', pricePerUnit: 350, weeklyNeed: 1.5, staple: true },
  { id: 'cooking_oil', name: 'Cooking oil', unit: 'L', pricePerUnit: 320, weeklyNeed: 0.5, staple: true },
  { id: 'sukuma', name: 'Sukuma wiki', unit: 'bunch', pricePerUnit: 20, weeklyNeed: 5, staple: true },
  { id: 'wheat_flour', name: 'Wheat flour', unit: 'kg', pricePerUnit: 180, weeklyNeed: 1, staple: false },
  { id: 'avocado', name: 'Avocado', unit: 'pcs', pricePerUnit: 30, weeklyNeed: 3, staple: false },
];

const startOfWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

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

export default function BudgetTracker({ onItemsEnsure }) {
  const [items, setItems] = useState(() => loadLocal('pantry_items', defaultItems));
  const [budget, setBudget] = useState(() => loadLocal('pantry_budget_amount', 380));
  const [weekStart, setWeekStart] = useState(() => loadLocal('pantry_budget_week_start', startOfWeek(new Date())));
  const [logs, setLogs] = useState(() => loadLocal('pantry_logs', []));

  useEffect(() => {
    if (!localStorage.getItem('pantry_items')) {
      saveLocal('pantry_items', defaultItems);
    }
    onItemsEnsure && onItemsEnsure(items);
  }, []);

  useEffect(() => saveLocal('pantry_items', items), [items]);
  useEffect(() => saveLocal('pantry_budget_amount', budget), [budget]);
  useEffect(() => saveLocal('pantry_budget_week_start', weekStart), [weekStart]);
  useEffect(() => saveLocal('pantry_logs', logs), [logs]);

  const weekStartDate = useMemo(() => new Date(weekStart), [weekStart]);
  const weekEndDate = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  const weekLogs = useMemo(
    () => logs.filter((l) => new Date(l.date) >= weekStartDate && new Date(l.date) < weekEndDate),
    [logs, weekStartDate, weekEndDate]
  );

  const spent = useMemo(() => weekLogs.reduce((s, l) => s + l.total, 0), [weekLogs]);
  const remaining = Math.max(budget - spent, 0);
  const pct = Math.min((spent / (budget || 1)) * 100, 100);

  const [selectedId, setSelectedId] = useState('milk');
  const [qty, setQty] = useState(1);

  const selectedItem = items.find((i) => i.id === selectedId) || items[0];
  const currentPrice = selectedItem ? selectedItem.pricePerUnit : 0;
  const currentCost = Number((qty * currentPrice).toFixed(2));

  const addLog = () => {
    if (!selectedItem) return;
    const entry = {
      id: 'log_' + Date.now(),
      itemId: selectedItem.id,
      name: selectedItem.name,
      unit: selectedItem.unit,
      qty: Number(qty),
      unitPrice: selectedItem.pricePerUnit,
      total: Number((Number(qty) * selectedItem.pricePerUnit).toFixed(2)),
      date: new Date().toISOString(),
    };
    const newLogs = [entry, ...logs];
    setLogs(newLogs);
    const onhand = loadLocal('pantry_onhand', {});
    const cur = onhand[selectedItem.id] || 0;
    onhand[selectedItem.id] = Number((cur + Number(qty)).toFixed(2));
    saveLocal('pantry_onhand', onhand);
  };

  const resetWeek = () => {
    setWeekStart(startOfWeek(new Date()));
  };

  const trySwap = (logId) => {
    const log = logs.find((l) => l.id === logId);
    if (!log) return;
    const from = items.find((i) => i.id === log.itemId);
    if (!from || !from.substitute) return;
    const to = items.find((i) => i.id === from.substitute);
    if (!to) return;
    const newTotal = Number((log.qty * to.pricePerUnit).toFixed(2));
    const savings = Number((log.total - newTotal).toFixed(2));
    const newLogs = logs.map((l) =>
      l.id === logId
        ? { ...l, itemId: to.id, name: to.name, unit: to.unit, unitPrice: to.pricePerUnit, total: newTotal, swappedFrom: from.name }
        : l
    );
    setLogs(newLogs);
    if (savings > 0) {
      alert(`Swap saved KES ${savings}`);
    }
  };

  const removeLog = (logId) => {
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  return (
    <section className="w-full p-4 pb-2">
      <div className="rounded-xl p-4" style={{ background: '#f1f8f4', border: `1px solid ${KENYAN_GREEN}22` }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold" style={{ color: KENYAN_GREEN }}>Weekly Budget</h1>
            <p className="text-xs text-gray-600">Track spend and log purchases. Offline & private.</p>
          </div>
          <button onClick={resetWeek} className="text-xs px-3 py-1 rounded-md border" style={{ borderColor: KENYAN_GREEN, color: KENYAN_GREEN }}>Reset Week</button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="text-sm">KES</label>
          <input type="number" className="flex-1 px-3 py-2 rounded-md border text-right" value={budget}
            onChange={(e) => setBudget(Number(e.target.value) || 0)} />
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-sm">
            <span>Spent: KES {spent.toFixed(0)}</span>
            <span>Left: KES {remaining.toFixed(0)}</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full mt-1 overflow-hidden">
            <div className="h-3 rounded-full" style={{ width: `${pct}%`, background: KENYAN_GREEN }} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-12 gap-2">
          <select className="col-span-6 px-3 py-2 rounded-md border" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {items.map((i) => (
              <option key={i.id} value={i.id}>{i.name} — {i.pricePerUnit}/{i.unit}</option>
            ))}
          </select>
          <input className="col-span-3 px-3 py-2 rounded-md border" type="number" min="0" step="0.1" value={qty}
            onChange={(e) => setQty(e.target.value)} />
          <button onClick={addLog} className="col-span-3 px-3 py-2 rounded-md text-white" style={{ background: KENYAN_GREEN }}>Add (KES {currentCost})</button>
        </div>

        <div className="mt-3 text-xs text-gray-600">Week {new Date(weekStart).toLocaleDateString()} → {weekEndDate.toLocaleDateString()}</div>
      </div>

      <div className="mt-4">
        <h2 className="text-base font-semibold" style={{ color: KENYAN_GREEN }}>Purchases</h2>
        <ul className="mt-2 divide-y rounded-lg border">
          {weekLogs.length === 0 && (
            <li className="p-3 text-sm text-gray-500">No purchases yet</li>
          )}
          {weekLogs.map((l) => {
            const fromItem = items.find((i) => i.id === l.itemId);
            const canSwap = fromItem && fromItem.substitute && items.find((i) => i.id === fromItem.substitute);
            const swapTarget = canSwap ? items.find((i) => i.id === fromItem.substitute) : null;
            const potentialSave = swapTarget ? Number(((fromItem.pricePerUnit - swapTarget.pricePerUnit) * l.qty).toFixed(2)) : 0;
            return (
              <li key={l.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{l.name} × {l.qty} {l.unit}</div>
                  <div className="text-xs text-gray-500">KES {l.unitPrice}/{l.unit} · {new Date(l.date).toLocaleString()}</div>
                  {l.swappedFrom && <div className="text-[11px] text-amber-700">Swapped from {l.swappedFrom}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {canSwap && potentialSave > 0 && (
                    <button onClick={() => trySwap(l.id)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: KENYAN_GREEN, color: KENYAN_GREEN }}>
                      Swap → {swapTarget.name} (save {potentialSave})
                    </button>
                  )}
                  <button onClick={() => removeLog(l.id)} className="text-xs px-2 py-1 rounded border text-red-600 border-red-200">Remove</button>
                  <div className="text-sm font-semibold">KES {l.total.toFixed(0)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
