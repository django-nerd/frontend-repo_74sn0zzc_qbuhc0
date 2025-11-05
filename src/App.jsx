import React, { useEffect, useState } from 'react';
import BudgetTracker from './components/BudgetTracker';
import PriceListEditor from './components/PriceListEditor';
import SmartPantry from './components/SmartPantry';
import ToolsPanel from './components/ToolsPanel';

const KENYAN_GREEN = '#006633';

function App() {
  const [tab, setTab] = useState('budget');

  useEffect(() => {
    document.title = 'Pantry — Offline Kitchen Co‑pilot';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10" style={{ background: KENYAN_GREEN }}>
        <div className="max-w-xl mx-auto px-4 py-3 text-white flex items-center justify-between">
          <div className="font-bold">Pantry</div>
          <div className="text-[11px] opacity-90">Offline · No login · Private</div>
        </div>
        <nav className="max-w-xl mx-auto grid grid-cols-4 text-sm">
          {[
            { id: 'budget', label: 'Budget' },
            { id: 'pantry', label: 'Smart Pantry' },
            { id: 'prices', label: 'Prices' },
            { id: 'tools', label: 'Tools' },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={
              'px-2 py-2 text-white/90 ' + (tab === t.id ? 'bg-white text-emerald-900 font-semibold' : '')
            }>{t.label}</button>
          ))}
        </nav>
      </header>

      <main className="max-w-xl mx-auto">
        {tab === 'budget' && <BudgetTracker />}
        {tab === 'pantry' && <SmartPantry />}
        {tab === 'prices' && <PriceListEditor />}
        {tab === 'tools' && <ToolsPanel />}
      </main>

      <footer className="max-w-xl mx-auto px-4 pb-8 text-center text-[11px] text-gray-500">
        <div>Tip: Share as a single-page app. Works without internet once opened.</div>
      </footer>
    </div>
  );
}

export default App;
