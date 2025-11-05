import React, { useEffect, useMemo, useState } from 'react';

const KENYAN_GREEN = '#006633';

// LocalStorage helpers
const ls = {
  get: (k, fallback) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner'];

// Default Kenyan meal bank
const DEFAULT_MEALS = [
  { name: 'Chai & Mandazi', tags: ['breakfast'], ingredients: ['Tea leaves', 'Milk', 'Sugar', 'Mandazi'] },
  { name: 'Uji (millet porridge)', tags: ['breakfast'], ingredients: ['Millet flour', 'Water', 'Sugar/Maziwa (optional)'] },
  { name: 'Ugali + Sukuma Wiki', tags: ['lunch', 'dinner'], ingredients: ['Maize flour', 'Sukuma wiki', 'Onion', 'Tomato', 'Oil', 'Salt'] },
  { name: 'Githeri', tags: ['lunch', 'dinner'], ingredients: ['Maize', 'Beans', 'Onion', 'Tomato', 'Oil', 'Salt'] },
  { name: 'Rice + Ndengu', tags: ['lunch', 'dinner'], ingredients: ['Rice', 'Ndengu (green grams)', 'Onion', 'Tomato', 'Oil', 'Salt'] },
  { name: 'Mokimo', tags: ['lunch', 'dinner'], ingredients: ['Potatoes', 'Maize', 'Greens', 'Onion', 'Salt'] },
  { name: 'Chapati + Beans', tags: ['lunch', 'dinner'], ingredients: ['Wheat flour', 'Oil', 'Water', 'Beans', 'Onion', 'Tomato', 'Spices'] },
  { name: 'Pilau (mild)', tags: ['lunch', 'dinner'], ingredients: ['Rice', 'Pilau masala', 'Onion', 'Tomato', 'Oil', 'Beef (optional)'] },
  { name: 'Matoke stew', tags: ['lunch', 'dinner'], ingredients: ['Matoke', 'Onion', 'Tomato', 'Oil', 'Salt'] },
  { name: 'Beef stew + Rice', tags: ['lunch', 'dinner'], ingredients: ['Beef', 'Onion', 'Tomato', 'Oil', 'Spices', 'Rice'] },
  { name: 'Fish + Ugali + Greens', tags: ['lunch', 'dinner'], ingredients: ['Fish', 'Maize flour', 'Greens', 'Onion', 'Tomato', 'Oil'] },
  { name: 'Mala + Sweet potato', tags: ['breakfast', 'dinner'], ingredients: ['Mala', 'Sweet potatoes'] },
];

const defaultPlan = () => {
  // A balanced, budget‑friendly starter plan
  return DAYS.reduce((acc, day, i) => {
    acc[day] = {
      Breakfast: i % 2 === 0 ? 'Chai & Mandazi' : 'Uji (millet porridge)',
      Lunch: ['Ugali + Sukuma Wiki', 'Githeri', 'Rice + Ndengu', 'Chapati + Beans'][i % 4],
      Dinner: ['Mala + Sweet potato', 'Ugali + Sukuma Wiki', 'Matoke stew', 'Beef stew + Rice'][i % 4],
    };
    return acc;
  }, {});
};

function Section({ title, children, right }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ background: '#f7fcf9' }}>
        <h2 className="text-sm font-semibold" style={{ color: KENYAN_GREEN }}>{title}</h2>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DietPlanner() {
  const [mealBank, setMealBank] = useState(() => ls.get('diet_meals_bank', DEFAULT_MEALS));
  const [plan, setPlan] = useState(() => ls.get('diet_week_plan', defaultPlan()));
  const [notes, setNotes] = useState(() => ls.get('diet_notes', ''));
  const [filter, setFilter] = useState('all');

  useEffect(() => ls.set('diet_meals_bank', mealBank), [mealBank]);
  useEffect(() => ls.set('diet_week_plan', plan), [plan]);
  useEffect(() => ls.set('diet_notes', notes), [notes]);

  const filteredMeals = useMemo(() => {
    if (filter === 'all') return mealBank;
    return mealBank.filter(m => m.tags.includes(filter));
  }, [mealBank, filter]);

  const ingredientsSummary = useMemo(() => {
    const map = new Map();
    const add = (ing) => {
      const key = ing.trim();
      map.set(key, (map.get(key) || 0) + 1);
    };
    DAYS.forEach((d) => {
      MEALS.forEach((m) => {
        const meal = plan[d][m];
        const def = mealBank.find(x => x.name === meal);
        if (def && def.ingredients) def.ingredients.forEach(add);
      });
    });
    return Array.from(map.entries()).sort((a,b) => b[1]-a[1]);
  }, [plan, mealBank]);

  const copyShoppingList = async () => {
    const text = ingredientsSummary.map(([name, count]) => `- ${name} x${count}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      alert('Shopping list copied!');
    } catch {
      alert('Copy failed. Long-press to select and copy.');
    }
  };

  const resetWeek = () => {
    if (confirm('Reset the weekly diet plan to defaults?')) setPlan(defaultPlan());
  };

  return (
    <div className="space-y-4 p-4">
      <Section
        title="Weekly Diet Plan"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={resetWeek}
              className="text-xs px-3 py-1.5 rounded-md border border-emerald-700 text-emerald-800"
            >Reset</button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3">
          {DAYS.map((day) => (
            <div key={day} className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-3 py-2 text-xs font-semibold" style={{ background: '#f0fdf4', color: KENYAN_GREEN }}>{day}</div>
              <div className="divide-y">
                {MEALS.map((mealType) => (
                  <MealRow
                    key={mealType}
                    label={mealType}
                    value={plan[day][mealType]}
                    onChange={(val) => setPlan((p) => ({ ...p, [day]: { ...p[day], [mealType]: val } }))}
                    mealBank={mealBank}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Meal Bank"
        right={
          <div className="flex items-center gap-2">
            <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="text-xs border rounded-md px-2 py-1">
              <option value="all">All</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
            <AddMeal onAdd={(m)=> setMealBank((b)=> [m, ...b])} />
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          {filteredMeals.map((m, idx) => (
            <div key={idx} className="border rounded-lg p-2">
              <div className="text-sm font-medium">{m.name}</div>
              <div className="text-[11px] text-gray-500">{m.tags.join(', ')}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {m.ingredients.map((ing, i) => (
                  <span key={i} className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">{ing}</span>
                ))}
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => setMealBank((b)=> b.filter((x)=> x !== m))}
                  className="text-xs text-red-600"
                >Remove</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Shopping List (week)"
        right={<button onClick={copyShoppingList} className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white">Copy</button>}
      >
        <ul className="text-sm list-disc pl-5 space-y-1">
          {ingredientsSummary.map(([name, count], i) => (
            <li key={i}>{name} <span className="text-gray-500">x{count}</span></li>
          ))}
        </ul>
      </Section>

      <Section title="Diet Notes">
        <textarea
          value={notes}
          onChange={(e)=> setNotes(e.target.value)}
          placeholder="Allergies, preferences, swaps..."
          className="w-full h-28 border rounded-md p-2 text-sm"
        />
      </Section>
    </div>
  );
}

function MealRow({ label, value, onChange, mealBank }) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => {
    const t = label.toLowerCase();
    return mealBank.filter(m => m.tags.includes(t) || t === 'dinner' && m.tags.includes('lunch'));
  }, [mealBank, label]);

  return (
    <div className="p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e)=> onChange(e.target.value)}
          className="flex-1 border rounded-md px-2 py-1 text-sm"
        />
        <button
          onClick={() => setOpen((v)=>!v)}
          className="text-xs px-2 py-1 rounded-md border border-gray-300"
        >Suggest</button>
      </div>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { onChange(s.name); setOpen(false); }}
              className="text-left text-sm border rounded-md px-2 py-1 hover:bg-emerald-50"
            >{s.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function AddMeal({ onAdd }) {
  const [name, setName] = useState('');
  const [tags, setTags] = useState('lunch');
  const [ingredients, setIngredients] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, tags: tags.split(',').map(t=>t.trim()).filter(Boolean), ingredients: ingredients.split(',').map(i=>i.trim()).filter(Boolean) });
    setName('');
    setIngredients('');
    setTags('lunch');
  };

  return (
    <div className="flex items-center gap-2">
      <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Meal name" className="text-xs border rounded-md px-2 py-1 w-28" />
      <input value={tags} onChange={(e)=>setTags(e.target.value)} placeholder="tags (e.g., breakfast,lunch)" className="text-xs border rounded-md px-2 py-1 w-40" />
      <input value={ingredients} onChange={(e)=>setIngredients(e.target.value)} placeholder="ingredients (comma)" className="text-xs border rounded-md px-2 py-1 w-52" />
      <button onClick={submit} className="text-xs px-2 py-1 rounded-md bg-emerald-600 text-white">Add</button>
    </div>
  );
}

export default DietPlanner;
